import copy
import json
import unittest
from unittest.mock import patch

import numpy as np

import app.services.pre_analysis_job_store as job_store


class FakeRedis:
    def __init__(self):
        self.data = {}
        self.fail_setex = False

    def ping(self):
        return True

    def setex(self, key, ttl, value):
        if self.fail_setex:
            raise TypeError("simulated redis serialization failure")
        self.data[key] = value

    def get(self, key):
        return self.data.get(key)


class TestPreAnalysisJobStore(unittest.TestCase):
    def setUp(self):
        with job_store._memory_lock:
            job_store._memory_jobs.clear()
        job_store._redis_fallback_active = False

    def tearDown(self):
        with job_store._memory_lock:
            job_store._memory_jobs.clear()
        job_store._redis_fallback_active = False

    def test_save_and_get_job_with_json_safe_payload_uses_shared_shape(self):
        fake_redis = FakeRedis()
        task_id = "task-json-safe"

        with patch.object(job_store, "get_healthy_redis_client", return_value=fake_redis):
            stored = job_store.save_job(task_id, {"status": "queued", "meta": {"step": 1}})
            fetched = job_store.get_job(task_id)

        self.assertEqual(stored["status"], "queued")
        self.assertEqual(fetched["status"], "queued")
        self.assertEqual(fetched["meta"], {"step": 1})
        self.assertEqual(json.loads(fake_redis.data[job_store._job_key(task_id)])["status"], "queued")

    def test_update_job_normalizes_pp1_like_nested_numpy_payload_for_redis(self):
        fake_redis = FakeRedis()
        task_id = "task-pp1-numpy"

        pp1_like_result = [
            {
                "status": "accepted_degraded",
                "confidence": np.float32(0.95),
                "bbox": (1, 2, 3, 4),
                "raw": {
                    "timings": {
                        "total_ms": np.float32(123.4),
                    },
                    "labels": {"Wallet", "Purse"},
                    "embeddings": np.array([0.1, 0.2], dtype=np.float32),
                },
            }
        ]

        with patch.object(job_store, "get_healthy_redis_client", return_value=fake_redis):
            job_store.save_job(task_id, {"status": "queued"})
            updated = job_store.update_job(
                task_id,
                {"status": "completed", "result": pp1_like_result},
            )
            fetched = job_store.get_job(task_id)

        self.assertEqual(updated["status"], "completed")
        self.assertEqual(fetched["status"], "completed")
        self.assertIsInstance(fetched["result"][0]["confidence"], float)
        self.assertEqual(fetched["result"][0]["bbox"], [1, 2, 3, 4])
        self.assertEqual(len(fetched["result"][0]["raw"]["embeddings"]), 2)
        self.assertAlmostEqual(fetched["result"][0]["raw"]["embeddings"][0], 0.1, places=5)
        self.assertAlmostEqual(fetched["result"][0]["raw"]["embeddings"][1], 0.2, places=5)
        self.assertIsInstance(fetched["result"][0]["raw"]["timings"]["total_ms"], float)

        redis_payload = json.loads(fake_redis.data[job_store._job_key(task_id)])
        self.assertEqual(redis_payload["status"], "completed")
        self.assertEqual(redis_payload["result"][0]["bbox"], [1, 2, 3, 4])

    def test_get_job_prefers_newer_memory_payload_when_redis_is_stale(self):
        fake_redis = FakeRedis()
        task_id = "task-stale-redis"

        with patch.object(job_store, "get_healthy_redis_client", return_value=fake_redis):
            job_store.save_job(task_id, {"status": "queued"})
            fake_redis.fail_setex = True
            updated = job_store.update_job(task_id, {"status": "completed", "result": {"ok": True}})
            fetched = job_store.get_job(task_id)

        self.assertEqual(updated["status"], "completed")
        self.assertEqual(fetched["status"], "completed")
        redis_payload = json.loads(fake_redis.data[job_store._job_key(task_id)])
        self.assertEqual(redis_payload["status"], "queued")

    def test_memory_fallback_works_when_redis_is_unavailable(self):
        task_id = "task-memory-only"

        with patch.object(job_store, "get_healthy_redis_client", return_value=None):
            job_store.save_job(task_id, {"status": "queued"})
            fetched_before = copy.deepcopy(job_store.get_job(task_id))
            updated = job_store.update_job(task_id, {"status": "failed", "error": "boom"})
            fetched_after = copy.deepcopy(job_store.get_job(task_id))

        self.assertEqual(fetched_before["status"], "queued")
        self.assertEqual(updated["status"], "failed")
        self.assertEqual(fetched_after["status"], "failed")
        self.assertEqual(fetched_after["error"], "boom")


if __name__ == "__main__":
    unittest.main()

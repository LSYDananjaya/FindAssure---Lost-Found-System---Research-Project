"""
Test script to demonstrate the zero-match security check
This shows why even one 0% answer should reject ownership
"""

print("=" * 80)
print("🔒 SECURITY TEST: Zero-Match Question Detection")
print("=" * 80)

test_scenarios = [
    {
        "name": "Scenario 1: Perfect Owner (All Match)",
        "questions": [
            {"q": "What color?", "scores": {"Q1": 0.95, "Q2": 0.92, "Q3": 0.98, "Q4": 0.91, "Q5": 0.94}},
        ],
        "average": 0.94,
        "min_score": 0.91,
        "should_verify": True,
        "description": "All questions have high scores → Owner verified ✅"
    },
    {
        "name": "Scenario 2: One Complete Failure (FRAUD ATTEMPT)",
        "questions": [
            {"q": "What color?", "scores": {"Q1": 0.95, "Q2": 0.00, "Q3": 0.98, "Q4": 0.92, "Q5": 0.94}},
        ],
        "average": 0.76,  # Still above 70%!
        "min_score": 0.00,
        "should_verify": False,
        "description": "Q2 = 0% (owner doesn't know) → REJECT ❌ even with 76% average"
    },
    {
        "name": "Scenario 3: Very Low Score on Critical Question",
        "questions": [
            {"q": "What's inside?", "scores": {"Q1": 0.90, "Q2": 0.05, "Q3": 0.95, "Q4": 0.93, "Q5": 0.92}},
        ],
        "average": 0.75,  # Above 70%
        "min_score": 0.05,
        "should_verify": False,
        "description": "Q2 = 5% (basically guessing) → REJECT ❌"
    },
    {
        "name": "Scenario 4: All Medium Scores (Legitimate Uncertainty)",
        "questions": [
            {"q": "Describe it", "scores": {"Q1": 0.65, "Q2": 0.68, "Q3": 0.70, "Q4": 0.67, "Q5": 0.69}},
        ],
        "average": 0.68,
        "min_score": 0.65,
        "should_verify": False,
        "description": "All low but none zero → REJECT ❌ (below 70% avg)"
    },
    {
        "name": "Scenario 5: Borderline Pass",
        "questions": [
            {"q": "Any damage?", "scores": {"Q1": 0.72, "Q2": 0.75, "Q3": 0.71, "Q4": 0.15, "Q5": 0.77}},
        ],
        "average": 0.62,
        "min_score": 0.15,
        "should_verify": False,
        "description": "Q4 = 15% (too low) → REJECT ❌"
    },
    {
        "name": "Scenario 6: All Questions Just Pass Threshold",
        "questions": [
            {"q": "Details", "scores": {"Q1": 0.71, "Q2": 0.72, "Q3": 0.73, "Q4": 0.11, "Q5": 0.74}},
        ],
        "average": 0.60,
        "min_score": 0.11,
        "should_verify": False,
        "description": "Q4 = 11% (just above 10% but suspicious) → REJECT ❌"
    },
]

def check_ownership(scores, avg, min_score, threshold_min=0.10, threshold_avg=0.70):
    """
    Implements the new security logic:
    1. If ANY score ≤ 10% → REJECT (fraud detection)
    2. Else if average ≥ 70% → VERIFY
    3. Else → REJECT
    """
    has_zero = min_score <= threshold_min
    
    if has_zero:
        return False, f"CRITICAL: One question has {min_score*100:.0f}% similarity (≤10%)"
    elif avg >= threshold_avg:
        return True, f"VERIFIED: Average {avg*100:.0f}% ≥ 70%"
    else:
        return False, f"REJECTED: Average {avg*100:.0f}% < 70%"

print()
for i, scenario in enumerate(test_scenarios, 1):
    print(f"\n{'─' * 80}")
    print(f"📋 {scenario['name']}")
    print(f"{'─' * 80}")
    
    scores_dict = scenario['questions'][0]['scores']
    scores_list = list(scores_dict.values())
    
    print(f"\n   Question Scores:")
    for q_name, score in scores_dict.items():
        emoji = "❌" if score <= 0.10 else ("⚠️" if score < 0.70 else "✅")
        print(f"      {emoji} {q_name}: {score*100:>5.0f}%")
    
    print(f"\n   📊 Statistics:")
    print(f"      Average:  {scenario['average']*100:.0f}%")
    print(f"      Minimum:  {scenario['min_score']*100:.0f}% ⚠️")
    
    is_verified, reason = check_ownership(
        scores_list, 
        scenario['average'], 
        scenario['min_score']
    )
    
    print(f"\n   🎯 Decision:")
    if is_verified:
        result_emoji = "✅ VERIFIED"
        result_color = "GREEN"
    else:
        result_emoji = "❌ REJECTED"
        result_color = "RED"
    
    print(f"      {result_emoji}")
    print(f"      Reason: {reason}")
    
    # Check if result matches expectation
    if is_verified == scenario['should_verify']:
        print(f"      ✓ Correct decision!")
    else:
        print(f"      ✗ UNEXPECTED RESULT!")
    
    print(f"\n   💡 {scenario['description']}")

print("\n" + "=" * 80)
print("🔐 SECURITY SUMMARY")
print("=" * 80)
print("""
KEY PROTECTION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🚨 ZERO-MATCH DETECTION (NEW!)
   • If ANY question ≤ 10% similarity → INSTANT REJECTION
   • Prevents fraud: Even if owner knows 4/5 answers, failing one = suspicious
   • Example: Answers 4 questions correctly but says "I don't know" to one
              → Not the real owner!

2. ✅ AVERAGE THRESHOLD (Existing)
   • All questions > 10% BUT average ≥ 70% → VERIFIED
   • Example: Five questions with 72%, 75%, 71%, 74%, 73% → Pass

3. ⚠️ COMBINED PROTECTION
   • Must pass BOTH checks to be verified
   • Minimum score check prevents lucky guesses
   • Average check ensures overall knowledge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY THIS MATTERS:
• 🎭 Fraud Prevention: Someone who overheard details but isn't owner will
                      fail on questions they couldn't hear/guess
• 🔒 Security: One complete failure is a red flag even with high average
• ⚖️ Fairness: Legitimate owners know ALL basic details about their item

THRESHOLD RATIONALE:
• 10% = "Essentially no match" (catches random/wrong answers)
• 70% = "High confidence" (owner demonstrates good knowledge)
""")
print("=" * 80)

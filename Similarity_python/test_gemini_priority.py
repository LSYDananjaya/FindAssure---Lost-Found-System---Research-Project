"""
Test script to demonstrate the improved Gemini priority logic
This shows why trusting high-confidence Gemini scores is better
"""

print("=" * 70)
print("🧪 TESTING: Gemini Priority Logic (≥90% = Trust Completely)")
print("=" * 70)

# Simulate different scenarios
test_cases = [
    {
        "name": "Case 1: Exact Match - Gemini Confident",
        "nlp_score": 0.65,  # NLP fails (65%)
        "gemini_score": 0.95,  # Gemini succeeds (95%)
    },
    {
        "name": "Case 2: Exact Match - Gemini Very Confident",
        "nlp_score": 0.60,  # NLP fails (60%)
        "gemini_score": 0.98,  # Gemini very confident (98%)
    },
    {
        "name": "Case 3: Close Match - Gemini Somewhat Sure",
        "nlp_score": 0.75,  # NLP thinks good (75%)
        "gemini_score": 0.85,  # Gemini thinks good (85%)
    },
    {
        "name": "Case 4: Partial Match - Both Agree",
        "nlp_score": 0.55,  # NLP unsure (55%)
        "gemini_score": 0.60,  # Gemini unsure (60%)
    },
    {
        "name": "Case 5: Perfect Detection by Gemini",
        "nlp_score": 0.45,  # NLP says mismatch (45%)
        "gemini_score": 1.00,  # Gemini says perfect (100%)
    },
]

def old_logic(nlp, gemini):
    """Old fusion: Always blend 60/40"""
    return (nlp * 0.6) + (gemini * 0.4)

def new_logic(nlp, gemini):
    """New logic: Trust Gemini if ≥90%"""
    if gemini >= 0.90:
        return gemini  # Trust Gemini completely
    else:
        return (nlp * 0.6) + (gemini * 0.4)

print()
for case in test_cases:
    print(f"\n📌 {case['name']}")
    print(f"   NLP Score:    {case['nlp_score']*100:.0f}%")
    print(f"   Gemini Score: {case['gemini_score']*100:.0f}%")
    
    old_result = old_logic(case['nlp_score'], case['gemini_score'])
    new_result = new_logic(case['nlp_score'], case['gemini_score'])
    
    print(f"   ❌ OLD Logic:  {old_result*100:.0f}% (blended)")
    print(f"   ✅ NEW Logic:  {new_result*100:.0f}% ", end="")
    
    if case['gemini_score'] >= 0.90:
        print(f"(Gemini trusted! 🎯)")
        improvement = new_result - old_result
        print(f"      → Improvement: +{improvement*100:.0f} percentage points!")
    else:
        print(f"(blended)")

print("\n" + "=" * 70)
print("✅ SUMMARY:")
print("=" * 70)
print("When Gemini score ≥ 90%:")
print("  • OLD: Low NLP score drags down final score")
print("  • NEW: Gemini score used directly (100% trust)")
print()
print("When Gemini score < 90%:")
print("  • Both OLD and NEW use blended approach (60% NLP + 40% Gemini)")
print()
print("🎯 BENEFIT: Correctly identified matches by Gemini won't be")
print("            penalized by incorrect NLP analysis!")
print("=" * 70)

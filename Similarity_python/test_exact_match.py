"""
Test script to demonstrate why exact matches don't always get 100% scores
"""
from local_nlp_checker import LocalNLP

def test_exact_matches():
    nlp = LocalNLP()
    
    test_cases = [
        {
            "name": "Perfect Match",
            "founder": "black leather bag",
            "owner": "black leather bag"
        },
        {
            "name": "Stop Words Only",
            "founder": "it is there",
            "owner": "it is there"
        },
        {
            "name": "With Articles",
            "founder": "the black bag",
            "owner": "the black bag"
        },
        {
            "name": "With Adverbs",
            "founder": "very small bag",
            "owner": "very small bag"
        },
        {
            "name": "Simple Description",
            "founder": "red color",
            "owner": "red color"
        }
    ]
    
    print("=" * 80)
    print("TESTING EXACT MATCH BEHAVIOR")
    print("=" * 80)
    
    for test in test_cases:
        print(f"\n📝 Test: {test['name']}")
        print(f"   Founder: '{test['founder']}'")
        print(f"   Owner:   '{test['owner']}'")
        
        result = nlp.score_pair(test['founder'], test['owner'])
        
        # Show processed tokens
        tok_f = nlp.tokenize(test['founder'])
        tok_o = nlp.tokenize(test['owner'])
        lem_f = nlp.lemmas(tok_f)
        lem_o = nlp.lemmas(tok_o)
        
        print(f"\n   After Processing:")
        print(f"   Founder tokens: {lem_f}")
        print(f"   Owner tokens:   {lem_o}")
        print(f"   Match: {lem_f == lem_o}")
        
        print(f"\n   📊 Scores:")
        features = result['features']
        for key, value in features.items():
            print(f"      {key:12s}: {value:.2%}")
        
        print(f"\n   🎯 FINAL FUSED SCORE: {result['fused']:.2%}")
        
        if result['fused'] < 1.0:
            print(f"   ⚠️  NOT 100% - Here's why:")
            if not lem_f or not lem_o:
                print(f"      → All words were filtered out as stop words!")
            if lem_f != lem_o:
                print(f"      → Tokens don't match after processing")
            if features['tfidf'] < 1.0:
                print(f"      → TF-IDF with only 2 documents is imperfect")
        else:
            print(f"   ✅ Perfect 100% match!")
        
        print("-" * 80)

if __name__ == "__main__":
    test_exact_matches()

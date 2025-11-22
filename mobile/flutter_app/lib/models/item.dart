import 'question.dart';

/// Item Model
class Item {
  final int? id;
  final String category;
  final String description;
  final String founderId;
  final List<Question> questions;
  final DateTime? createdAt;

  Item({
    this.id,
    required this.category,
    required this.description,
    required this.founderId,
    required this.questions,
    this.createdAt,
  });

  /// Create Item from JSON (from API response)
  factory Item.fromJson(Map<String, dynamic> json) {
    List<Question> questionList = [];
    
    if (json['questions'] != null) {
      questionList = (json['questions'] as List)
          .map((q) => Question(
                text: q['question'],
                answer: q['founder_answer'] ?? q['founderAnswer'] ?? '',
              ))
          .toList();
    }

    return Item(
      id: json['id'],
      category: json['category'],
      description: json['description'],
      founderId: json['founderId'] ?? json['founder_id'],
      questions: questionList,
      createdAt: json['createdAt'] != null || json['created_at'] != null
          ? DateTime.parse(json['createdAt'] ?? json['created_at'])
          : null,
    );
  }

  /// Convert Item to JSON for API request
  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'description': description,
      'founderId': founderId,
      'questions': questions.map((q) => q.toJson()).toList(),
    };
  }

  /// Create a copy with updated values
  Item copyWith({
    int? id,
    String? category,
    String? description,
    String? founderId,
    List<Question>? questions,
    DateTime? createdAt,
  }) {
    return Item(
      id: id ?? this.id,
      category: category ?? this.category,
      description: description ?? this.description,
      founderId: founderId ?? this.founderId,
      questions: questions ?? this.questions,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

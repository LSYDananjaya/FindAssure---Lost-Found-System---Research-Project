## Question Model
class Question {
  final String text;
  bool isSelected;
  String answer;

  Question({
    required this.text,
    this.isSelected = false,
    this.answer = '',
  });

  /// Create Question from JSON (from API response)
  factory Question.fromJson(String questionText) {
    return Question(
      text: questionText,
    );
  }

  /// Convert Question to JSON for API request
  Map<String, dynamic> toJson() {
    return {
      'question': text,
      'founderAnswer': answer,
    };
  }

  /// Create a copy with updated values
  Question copyWith({
    String? text,
    bool? isSelected,
    String? answer,
  }) {
    return Question(
      text: text ?? this.text,
      isSelected: isSelected ?? this.isSelected,
      answer: answer ?? this.answer,
    );
  }
}

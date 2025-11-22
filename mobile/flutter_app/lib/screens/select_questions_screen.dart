import 'package:flutter/material.dart';
import '../models/question.dart';
import 'answer_questions_screen.dart';

/// Screen 2: Select Questions
/// Allows founder to choose which questions to answer
class SelectQuestionsScreen extends StatefulWidget {
  final String category;
  final String description;
  final String founderId;
  final List<String> generatedQuestions;

  const SelectQuestionsScreen({
    Key? key,
    required this.category,
    required this.description,
    required this.founderId,
    required this.generatedQuestions,
  }) : super(key: key);

  @override
  State<SelectQuestionsScreen> createState() => _SelectQuestionsScreenState();
}

class _SelectQuestionsScreenState extends State<SelectQuestionsScreen> {
  late List<Question> _questions;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Convert string questions to Question objects
    _questions = widget.generatedQuestions
        .map((q) => Question(text: q))
        .toList();
  }

  void _toggleQuestion(int index) {
    setState(() {
      _questions[index].isSelected = !_questions[index].isSelected;
      _errorMessage = null;
    });
  }

  void _continueToAnswers() {
    final selectedQuestions = _questions.where((q) => q.isSelected).toList();

    if (selectedQuestions.isEmpty) {
      setState(() {
        _errorMessage = 'Please select at least one question';
      });
      return;
    }

    // Navigate to answer screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AnswerQuestionsScreen(
          category: widget.category,
          description: widget.description,
          founderId: widget.founderId,
          selectedQuestions: selectedQuestions,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedCount = _questions.where((q) => q.isSelected).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Questions'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Header section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Select Verification Questions',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Choose the questions you can answer to help verify the owner',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      '$selectedCount question${selectedCount != 1 ? 's' : ''} selected',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Questions list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _questions.length,
              itemBuilder: (context, index) {
                final question = _questions[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: question.isSelected ? 3 : 1,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: question.isSelected
                          ? Colors.blue
                          : Colors.grey.shade300,
                      width: question.isSelected ? 2 : 1,
                    ),
                  ),
                  child: CheckboxListTile(
                    value: question.isSelected,
                    onChanged: (bool? value) {
                      _toggleQuestion(index);
                    },
                    title: Text(
                      question.text,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: question.isSelected
                            ? FontWeight.w600
                            : FontWeight.normal,
                        color: question.isSelected
                            ? Colors.blue.shade900
                            : Colors.black87,
                      ),
                    ),
                    activeColor: Colors.blue,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                );
              },
            ),
          ),

          // Error message
          if (_errorMessage != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber, color: Colors.orange.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.orange.shade700),
                    ),
                  ),
                ],
              ),
            ),

          // Bottom button
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: selectedCount > 0 ? _continueToAnswers : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  disabledBackgroundColor: Colors.grey.shade300,
                ),
                child: Text(
                  selectedCount > 0
                      ? 'Continue to Answer ($selectedCount)'
                      : 'Continue to Answer',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/question.dart';
import '../models/item.dart';

/// API Service for communicating with the backend
class ApiService {
  // Base URL - Update this to match your backend server
  static const String baseUrl = 'http://10.0.2.2:3000';

  // API endpoints
  static const String generateQuestionsEndpoint = '/api/questions/generate';
  static const String createItemEndpoint = '/api/items/create';
  static const String getItemEndpoint = '/api/items';

  /// Generate verification questions using AI
  ///
  /// [category] - Item category (e.g., "Electronics", "Clothing")
  /// [description] - Detailed item description
  ///
  /// Returns: List of generated question strings
  Future<List<String>> generateQuestions({
    required String category,
    required String description,
  }) async {
    try {
      final url = Uri.parse('$baseUrl$generateQuestionsEndpoint');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'category': category,
          'description': description,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);

        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> questions = data['data']['questions'];
          return questions.map((q) => q.toString()).toList();
        } else {
          throw Exception(data['message'] ?? 'Failed to generate questions');
        }
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        throw Exception(
            errorData['message'] ?? 'Server error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to generate questions: $e');
    }
  }

  /// Create a new item with selected questions and answers
  ///
  /// [item] - Item object containing all details
  ///
  /// Returns: Created item with ID from database
  Future<Item> createItem(Item item) async {
    try {
      final url = Uri.parse('$baseUrl$createItemEndpoint');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(item.toJson()),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);

        if (data['success'] == true && data['data'] != null) {
          return Item.fromJson(data['data']['item']);
        } else {
          throw Exception(data['message'] ?? 'Failed to create item');
        }
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        throw Exception(
            errorData['message'] ?? 'Server error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to create item: $e');
    }
  }

  /// Get item details by ID
  ///
  /// [itemId] - Item ID
  ///
  /// Returns: Item object with all details
  Future<Item> getItemById(int itemId) async {
    try {
      final url = Uri.parse('$baseUrl$getItemEndpoint/$itemId');

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);

        if (data['success'] == true && data['data'] != null) {
          return Item.fromJson(data['data']['item']);
        } else {
          throw Exception(data['message'] ?? 'Failed to get item');
        }
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        throw Exception(
            errorData['message'] ?? 'Server error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to get item: $e');
    }
  }

  /// Check if the backend service is healthy
  ///
  /// Returns: true if service is available
  Future<bool> checkHealth() async {
    try {
      final url = Uri.parse('$baseUrl/health');
      final response = await http.get(url);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!
Future<DocumentReference?> getDestinationRecord(
    String? destinationNickname, String? UID) async {
  // Clean and check inputs
  final nn = destinationNickname?.trim();
  final uid = UID?.trim();

  // 1. Check if the required nickname is provided.
  if (nn == null || nn.isEmpty) {
    return null;
  }

  // Define a base query for the 'destination' collection.
  Query query = FirebaseFirestore.instance.collection('destination');

  try {
    // 2. Build the query: Start with the required nickname.
    query = query.where('nickname', isEqualTo: nn);

    // 3. Conditionally add the UID for a more specific search.
    // NOTE: Verify that 'user_uid' is the correct field name in your Firestore.
    if (uid != null && uid.isNotEmpty) {
      query = query.where('destination_id', isEqualTo: uid);
    }

    // 4. Execute the combined query (limit 1).
    final querySnapshot = await query.limit(1).get();

    // 5. Process results.
    if (querySnapshot.docs.isNotEmpty) {
      // ✅ CHANGE 3: Return the DocumentReference (the pointer)
      return querySnapshot.docs.first.reference;
    } else {
      // No destination found matching the criteria.
      return null;
    }
  } catch (e) {
    // Handle any errors during the fetch
    print('Error fetching destination records by nickname: $e');
    return null;
  }
}

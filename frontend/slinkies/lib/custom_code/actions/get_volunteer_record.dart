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

/// Set your action name, define your arguments and return parameter, and then
/// add the boilerplate code using the green button on the right!
Future<DocumentReference?> getVolunteerRecord(
    String? volunteerid, String? lastname) async {
  // Clean and check inputs
  final vid = volunteerid?.trim();
  final lname = lastname?.trim();

  // 1. Check if we have at least one useful search parameter.
  if ((vid == null || vid.isEmpty) && (lname == null || lname.isEmpty)) {
    return null;
  }

  // Determine the search field and value.
  String searchField = '';
  String searchValue = '';

  if (vid != null && vid.isNotEmpty) {
    searchField = 'volunteer_id'; // Field name in Firestore for the ID
    searchValue = vid;
  } else if (lname != null && lname.isNotEmpty) {
    searchField = 'last_name'; // Field name in Firestore for the email
    searchValue = lname;
  } else {
    return null;
  }

  // 2. Execute the single dynamic query.
  try {
    final querySnapshot = await FirebaseFirestore.instance
        .collection('volunteers') // Targeting the correct collection
        .where(searchField, isEqualTo: searchValue)
        .limit(1)
        .get();

    if (querySnapshot.docs.isNotEmpty) {
      // Return the DocumentReference (the pointer)
      return querySnapshot.docs.first.reference;
    } else {
      return null;
    }
  } catch (e) {
    print('Error fetching volunteer by $searchField: $e');
    // If a search fails (often due to missing Firestore Index), return null.
    return null;
  }
}

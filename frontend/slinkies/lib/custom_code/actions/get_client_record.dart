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

import 'package:cloud_firestore/cloud_firestore.dart';

/// Set your action name, define your arguments and return parameter, and then
/// add the boilerplate code using the green button on the right!
Future<DocumentReference?> getClientRecord(String? clientid, String? lastname,
    String? firstname, String? emailaddress, String? primaryphone) async {
  // Clean and check inputs
  final uid = clientid?.trim();
  final ln = lastname?.trim();
  final fn = firstname?.trim();
  final em = emailaddress?.trim();
  final pp = primaryphone?.trim();

  String searchField = '';
  String searchValue = '';

  // 2. Cascade through the inputs, prioritizing the most unique fields.
  if (uid != null && uid.isNotEmpty) {
    // Highest priority: If client_id is provided, search directly by Document ID.
    try {
      final clientRef =
          FirebaseFirestore.instance.collection('clients').doc(uid);
      final docSnapshot = await clientRef.get();
      if (docSnapshot.exists) {
        // ✅ SUCCESS: If found by ID, return immediately.
        return clientRef;
      }
      // 💡 If NOT found by ID, DO NOT return null. Fall through to the next 'if'
      // to check other fields (email, phone, etc.) as the user might be
      // providing the ID AND another field in hopes of a match.
    } catch (e) {
      print('Error fetching client by ID: $e');
      // If the ID lookup threw an error, we ignore it and continue the search.
    }
  }

  if (em != null && em.isNotEmpty) {
    searchField = 'email_address';
    searchValue = em;
  } else if (pp != null && pp.isNotEmpty) {
    // ... (rest of the cascading search remains the same)
    searchField = 'primary_phone';
    searchValue = pp;
  } else if (ln != null && ln.isNotEmpty) {
    searchField = 'last_name';
    searchValue = ln;
  } else if (fn != null && fn.isNotEmpty) {
    searchField = 'first_name';
    searchValue = fn;
  } else {
    // If no useful parameter was found, stop here.
    return null;
  }

  // 3. Execute the single dynamic query based on the first found parameter.
  try {
    final querySnapshot = await FirebaseFirestore.instance
        .collection('clients')
        .where(searchField, isEqualTo: searchValue)
        .limit(1)
        .get();

    if (querySnapshot.docs.isNotEmpty) {
      // ✅ Return the DocumentReference from the found document
      return querySnapshot.docs.first.reference;
    } else {
      return null;
    }
  } catch (e) {
    print('Error fetching client by $searchField: $e');
    return null;
  }
}

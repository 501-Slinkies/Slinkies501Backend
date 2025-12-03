import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: FirebaseOptions(
            apiKey: "AIzaSyBc6flkUB95ViyofD_Rnk5HHKyr1uMSDjA",
            authDomain: "slinkies-43455.firebaseapp.com",
            projectId: "slinkies-43455",
            storageBucket: "slinkies-43455.firebasestorage.app",
            messagingSenderId: "28119792445",
            appId: "1:28119792445:web:8c2aeceb12e25d7359a354",
            measurementId: "G-RGZJ2NRDV4"));
  } else {
    await Firebase.initializeApp();
  }
}

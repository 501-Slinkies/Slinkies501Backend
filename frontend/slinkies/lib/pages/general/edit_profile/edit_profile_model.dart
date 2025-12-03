import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/forms/create_new_client/create_new_client_widget.dart';
import '/forms/create_new_ride/create_new_ride_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'edit_profile_widget.dart' show EditProfileWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class EditProfileModel extends FlutterFlowModel<EditProfileWidget> {
  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in edit-profile widget.
  VolunteersRecord? userLoggedIn;
  // State field(s) for DropDown widget.
  String? dropDownValue;
  FormFieldController<String>? dropDownValueController;
  // State field(s) for edit-name widget.
  FocusNode? editNameFocusNode;
  TextEditingController? editNameTextController;
  String? Function(BuildContext, String?)? editNameTextControllerValidator;
  // State field(s) for edit-email widget.
  FocusNode? editEmailFocusNode;
  TextEditingController? editEmailTextController;
  String? Function(BuildContext, String?)? editEmailTextControllerValidator;
  // State field(s) for edit-number widget.
  FocusNode? editNumberFocusNode;
  TextEditingController? editNumberTextController;
  String? Function(BuildContext, String?)? editNumberTextControllerValidator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue1;
  // State field(s) for Checkbox widget.
  bool? checkboxValue2;
  // State field(s) for Checkbox widget.
  bool? checkboxValue3;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    editNameFocusNode?.dispose();
    editNameTextController?.dispose();

    editEmailFocusNode?.dispose();
    editEmailTextController?.dispose();

    editNumberFocusNode?.dispose();
    editNumberTextController?.dispose();
  }
}

import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/modals/generic_success/generic_success_widget.dart';
import 'dart:ui';
import 'create_call_log_widget.dart' show CreateCallLogWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class CreateCallLogModel extends FlutterFlowModel<CreateCallLogWidget> {
  ///  State fields for stateful widgets in this component.

  final formKey = GlobalKey<FormState>();
  // State field(s) for date_of_call widget.
  FocusNode? dateOfCallFocusNode;
  TextEditingController? dateOfCallTextController;
  String? Function(BuildContext, String?)? dateOfCallTextControllerValidator;
  // State field(s) for call_type widget.
  String? callTypeValue;
  FormFieldController<String>? callTypeValueController;
  // State field(s) for first-name widget.
  FocusNode? firstNameFocusNode;
  TextEditingController? firstNameTextController;
  String? Function(BuildContext, String?)? firstNameTextControllerValidator;
  // State field(s) for last-name widget.
  FocusNode? lastNameFocusNode;
  TextEditingController? lastNameTextController;
  String? Function(BuildContext, String?)? lastNameTextControllerValidator;
  // State field(s) for email widget.
  FocusNode? emailFocusNode;
  TextEditingController? emailTextController;
  String? Function(BuildContext, String?)? emailTextControllerValidator;
  // State field(s) for primary_phone widget.
  FocusNode? primaryPhoneFocusNode;
  TextEditingController? primaryPhoneTextController;
  String? Function(BuildContext, String?)? primaryPhoneTextControllerValidator;
  String? _primaryPhoneTextControllerValidator(
      BuildContext context, String? val) {
    if (val == null || val.isEmpty) {
      return 'Primary Phone is required';
    }

    if (val.length < 10) {
      return 'Must Be 10 characters long';
    }
    if (val.length > 10) {
      return 'Must Be 10 characters long';
    }

    return null;
  }

  // State field(s) for cell widget.
  bool? cellValue;
  // State field(s) for message widget.
  FocusNode? messageFocusNode;
  TextEditingController? messageTextController;
  String? Function(BuildContext, String?)? messageTextControllerValidator;
  // State field(s) for name_and_date_message_forae widget.
  FocusNode? nameAndDateMessageForaeFocusNode;
  TextEditingController? nameAndDateMessageForaeTextController;
  String? Function(BuildContext, String?)?
      nameAndDateMessageForaeTextControllerValidator;
  // State field(s) for entered_by widget.
  FocusNode? enteredByFocusNode;
  TextEditingController? enteredByTextController;
  String? Function(BuildContext, String?)? enteredByTextControllerValidator;

  @override
  void initState(BuildContext context) {
    primaryPhoneTextControllerValidator = _primaryPhoneTextControllerValidator;
  }

  @override
  void dispose() {
    dateOfCallFocusNode?.dispose();
    dateOfCallTextController?.dispose();

    firstNameFocusNode?.dispose();
    firstNameTextController?.dispose();

    lastNameFocusNode?.dispose();
    lastNameTextController?.dispose();

    emailFocusNode?.dispose();
    emailTextController?.dispose();

    primaryPhoneFocusNode?.dispose();
    primaryPhoneTextController?.dispose();

    messageFocusNode?.dispose();
    messageTextController?.dispose();

    nameAndDateMessageForaeFocusNode?.dispose();
    nameAndDateMessageForaeTextController?.dispose();

    enteredByFocusNode?.dispose();
    enteredByTextController?.dispose();
  }
}

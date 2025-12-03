import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_checkbox_group.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/modals/duplicate_client/duplicate_client_widget.dart';
import '/modals/generic_success/generic_success_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import 'create_new_client_widget.dart' show CreateNewClientWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class CreateNewClientModel extends FlutterFlowModel<CreateNewClientWidget> {
  ///  State fields for stateful widgets in this component.

  final formKey = GlobalKey<FormState>();
  // State field(s) for last-name widget.
  FocusNode? lastNameFocusNode;
  TextEditingController? lastNameTextController;
  String? Function(BuildContext, String?)? lastNameTextControllerValidator;
  // State field(s) for first-name widget.
  FocusNode? firstNameFocusNode;
  TextEditingController? firstNameTextController;
  String? Function(BuildContext, String?)? firstNameTextControllerValidator;
  // State field(s) for adress1 widget.
  FocusNode? adress1FocusNode;
  TextEditingController? adress1TextController;
  String? Function(BuildContext, String?)? adress1TextControllerValidator;
  // State field(s) for address2 widget.
  FocusNode? address2FocusNode;
  TextEditingController? address2TextController;
  String? Function(BuildContext, String?)? address2TextControllerValidator;
  // State field(s) for zip widget.
  FocusNode? zipFocusNode;
  TextEditingController? zipTextController;
  String? Function(BuildContext, String?)? zipTextControllerValidator;
  // State field(s) for city widget.
  FocusNode? cityFocusNode;
  TextEditingController? cityTextController;
  String? Function(BuildContext, String?)? cityTextControllerValidator;
  // State field(s) for state widget.
  FocusNode? stateFocusNode;
  TextEditingController? stateTextController;
  String? Function(BuildContext, String?)? stateTextControllerValidator;
  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for Checkbox widget.
  bool? checkboxValue1;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController8;
  String? Function(BuildContext, String?)? textController8Validator;
  // State field(s) for primaryphone widget.
  FocusNode? primaryphoneFocusNode;
  TextEditingController? primaryphoneTextController;
  String? Function(BuildContext, String?)? primaryphoneTextControllerValidator;
  String? _primaryphoneTextControllerValidator(
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

  // State field(s) for Checkbox widget.
  bool? checkboxValue2;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController10;
  String? Function(BuildContext, String?)? textController10Validator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue3;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController11;
  String? Function(BuildContext, String?)? textController11Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode4;
  TextEditingController? textController12;
  String? Function(BuildContext, String?)? textController12Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode5;
  TextEditingController? textController13;
  String? Function(BuildContext, String?)? textController13Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
  // State field(s) for getmobilitygroup widget.
  FormFieldController<List<String>>? getmobilitygroupValueController;
  List<String>? get getmobilitygroupValues =>
      getmobilitygroupValueController?.value;
  set getmobilitygroupValues(List<String>? v) =>
      getmobilitygroupValueController?.value = v;

  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode6;
  TextEditingController? textController14;
  String? Function(BuildContext, String?)? textController14Validator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue4;
  // State field(s) for DropDown widget.
  String? dropDownValue4;
  FormFieldController<String>? dropDownValueController4;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode7;
  TextEditingController? textController15;
  String? Function(BuildContext, String?)? textController15Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode8;
  TextEditingController? textController16;
  String? Function(BuildContext, String?)? textController16Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode9;
  TextEditingController? textController17;
  String? Function(BuildContext, String?)? textController17Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode10;
  TextEditingController? textController18;
  String? Function(BuildContext, String?)? textController18Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode11;
  TextEditingController? textController19;
  String? Function(BuildContext, String?)? textController19Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue5;
  FormFieldController<String>? dropDownValueController5;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode12;
  TextEditingController? textController20;
  String? Function(BuildContext, String?)? textController20Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue6;
  FormFieldController<String>? dropDownValueController6;
  // Stores action output result for [Firestore Query - Query a collection] action in Button widget.
  int? fireStoreQuery;

  @override
  void initState(BuildContext context) {
    primaryphoneTextControllerValidator = _primaryphoneTextControllerValidator;
  }

  @override
  void dispose() {
    lastNameFocusNode?.dispose();
    lastNameTextController?.dispose();

    firstNameFocusNode?.dispose();
    firstNameTextController?.dispose();

    adress1FocusNode?.dispose();
    adress1TextController?.dispose();

    address2FocusNode?.dispose();
    address2TextController?.dispose();

    zipFocusNode?.dispose();
    zipTextController?.dispose();

    cityFocusNode?.dispose();
    cityTextController?.dispose();

    stateFocusNode?.dispose();
    stateTextController?.dispose();

    textFieldFocusNode1?.dispose();
    textController8?.dispose();

    primaryphoneFocusNode?.dispose();
    primaryphoneTextController?.dispose();

    textFieldFocusNode2?.dispose();
    textController10?.dispose();

    textFieldFocusNode3?.dispose();
    textController11?.dispose();

    textFieldFocusNode4?.dispose();
    textController12?.dispose();

    textFieldFocusNode5?.dispose();
    textController13?.dispose();

    textFieldFocusNode6?.dispose();
    textController14?.dispose();

    textFieldFocusNode7?.dispose();
    textController15?.dispose();

    textFieldFocusNode8?.dispose();
    textController16?.dispose();

    textFieldFocusNode9?.dispose();
    textController17?.dispose();

    textFieldFocusNode10?.dispose();
    textController18?.dispose();

    textFieldFocusNode11?.dispose();
    textController19?.dispose();

    textFieldFocusNode12?.dispose();
    textController20?.dispose();
  }
}

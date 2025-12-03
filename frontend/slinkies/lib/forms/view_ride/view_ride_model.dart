import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import 'dart:ui';
import '/custom_code/actions/index.dart' as actions;
import 'view_ride_widget.dart' show ViewRideWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ViewRideModel extends FlutterFlowModel<ViewRideWidget> {
  ///  Local state fields for this component.

  DateTime? date;

  DateTime? time;

  ///  State fields for stateful widgets in this component.

  // Stores action output result for [Firestore Query - Query a collection] action in view-ride widget.
  DestinationRecord? addressQuery;
  // Stores action output result for [Firestore Query - Query a collection] action in view-ride widget.
  ClientsRecord? clientQuery;
  // Stores action output result for [Custom Action - getClientRecord] action in view-ride widget.
  DocumentReference? clientDetails;
  // Stores action output result for [Firestore Query - Query a collection] action in view-ride widget.
  ClientsRecord? actualClientDetails;
  // Stores action output result for [Custom Action - getDestinationRecord] action in view-ride widget.
  DocumentReference? refDestination;
  // Stores action output result for [Firestore Query - Query a collection] action in view-ride widget.
  DestinationRecord? theDestinationRec;
  // State field(s) for Createdat widget.
  FocusNode? createdatFocusNode;
  TextEditingController? createdatTextController;
  String? Function(BuildContext, String?)? createdatTextControllerValidator;
  // State field(s) for DispatcherID widget.
  FocusNode? dispatcherIDFocusNode;
  TextEditingController? dispatcherIDTextController;
  String? Function(BuildContext, String?)? dispatcherIDTextControllerValidator;
  // State field(s) for status widget.
  String? statusValue;
  FormFieldController<String>? statusValueController;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController3;
  String? Function(BuildContext, String?)? textController3Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController4;
  String? Function(BuildContext, String?)? textController4Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController5;
  String? Function(BuildContext, String?)? textController5Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode4;
  TextEditingController? textController6;
  String? Function(BuildContext, String?)? textController6Validator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue1;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode5;
  TextEditingController? textController7;
  String? Function(BuildContext, String?)? textController7Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode6;
  TextEditingController? textController8;
  String? Function(BuildContext, String?)? textController8Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode7;
  TextEditingController? textController9;
  String? Function(BuildContext, String?)? textController9Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode8;
  TextEditingController? textController10;
  String? Function(BuildContext, String?)? textController10Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode9;
  TextEditingController? textController11;
  String? Function(BuildContext, String?)? textController11Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode10;
  TextEditingController? textController12;
  String? Function(BuildContext, String?)? textController12Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode11;
  TextEditingController? textController13;
  String? Function(BuildContext, String?)? textController13Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode12;
  TextEditingController? textController14;
  String? Function(BuildContext, String?)? textController14Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode13;
  TextEditingController? textController15;
  String? Function(BuildContext, String?)? textController15Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
  // State field(s) for DropDown widget.
  String? dropDownValue4;
  FormFieldController<String>? dropDownValueController4;
  // State field(s) for Checkbox widget.
  bool? checkboxValue2;
  // State field(s) for Checkbox widget.
  bool? checkboxValue3;
  // State field(s) for Checkbox widget.
  bool? checkboxValue4;
  // State field(s) for DropDown widget.
  String? dropDownValue5;
  FormFieldController<String>? dropDownValueController5;
  // State field(s) for DropDown widget.
  String? dropDownValue6;
  FormFieldController<String>? dropDownValueController6;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode14;
  TextEditingController? textController16;
  String? Function(BuildContext, String?)? textController16Validator;
  DateTime? datePicked1;
  DateTime? datePicked2;
  // State field(s) for estimateddestination widget.
  FocusNode? estimateddestinationFocusNode;
  TextEditingController? estimateddestinationTextController;
  String? Function(BuildContext, String?)?
      estimateddestinationTextControllerValidator;
  // State field(s) for nickname widget.
  FocusNode? nicknameFocusNode;
  TextEditingController? nicknameTextController;
  String? Function(BuildContext, String?)? nicknameTextControllerValidator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode15;
  TextEditingController? textController19;
  String? Function(BuildContext, String?)? textController19Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode16;
  TextEditingController? textController20;
  String? Function(BuildContext, String?)? textController20Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode17;
  TextEditingController? textController21;
  String? Function(BuildContext, String?)? textController21Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode18;
  TextEditingController? textController22;
  String? Function(BuildContext, String?)? textController22Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode19;
  TextEditingController? textController23;
  String? Function(BuildContext, String?)? textController23Validator;
  // State field(s) for appointmenttype widget.
  String? appointmenttypeValue;
  FormFieldController<String>? appointmenttypeValueController;
  // State field(s) for triptype widget.
  String? triptypeValue;
  FormFieldController<String>? triptypeValueController;
  // State field(s) for externalcomment widget.
  FocusNode? externalcommentFocusNode;
  TextEditingController? externalcommentTextController;
  String? Function(BuildContext, String?)?
      externalcommentTextControllerValidator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue5;
  // State field(s) for nameridename widget.
  FocusNode? nameridenameFocusNode;
  TextEditingController? nameridenameTextController;
  String? Function(BuildContext, String?)? nameridenameTextControllerValidator;
  // State field(s) for relationshipclient widget.
  FocusNode? relationshipclientFocusNode;
  TextEditingController? relationshipclientTextController;
  String? Function(BuildContext, String?)?
      relationshipclientTextControllerValidator;
  // State field(s) for reoccuring widget.
  String? reoccuringValue;
  FormFieldController<String>? reoccuringValueController;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    createdatFocusNode?.dispose();
    createdatTextController?.dispose();

    dispatcherIDFocusNode?.dispose();
    dispatcherIDTextController?.dispose();

    textFieldFocusNode1?.dispose();
    textController3?.dispose();

    textFieldFocusNode2?.dispose();
    textController4?.dispose();

    textFieldFocusNode3?.dispose();
    textController5?.dispose();

    textFieldFocusNode4?.dispose();
    textController6?.dispose();

    textFieldFocusNode5?.dispose();
    textController7?.dispose();

    textFieldFocusNode6?.dispose();
    textController8?.dispose();

    textFieldFocusNode7?.dispose();
    textController9?.dispose();

    textFieldFocusNode8?.dispose();
    textController10?.dispose();

    textFieldFocusNode9?.dispose();
    textController11?.dispose();

    textFieldFocusNode10?.dispose();
    textController12?.dispose();

    textFieldFocusNode11?.dispose();
    textController13?.dispose();

    textFieldFocusNode12?.dispose();
    textController14?.dispose();

    textFieldFocusNode13?.dispose();
    textController15?.dispose();

    textFieldFocusNode14?.dispose();
    textController16?.dispose();

    estimateddestinationFocusNode?.dispose();
    estimateddestinationTextController?.dispose();

    nicknameFocusNode?.dispose();
    nicknameTextController?.dispose();

    textFieldFocusNode15?.dispose();
    textController19?.dispose();

    textFieldFocusNode16?.dispose();
    textController20?.dispose();

    textFieldFocusNode17?.dispose();
    textController21?.dispose();

    textFieldFocusNode18?.dispose();
    textController22?.dispose();

    textFieldFocusNode19?.dispose();
    textController23?.dispose();

    externalcommentFocusNode?.dispose();
    externalcommentTextController?.dispose();

    nameridenameFocusNode?.dispose();
    nameridenameTextController?.dispose();

    relationshipclientFocusNode?.dispose();
    relationshipclientTextController?.dispose();
  }

  /// Action blocks.
  Future getClientRecord(BuildContext context) async {}
}

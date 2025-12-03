import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_data_table.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/forms/create_call_log/create_call_log_widget.dart';
import '/forms/create_new_client/create_new_client_widget.dart';
import '/forms/create_new_ride/create_new_ride_widget.dart';
import '/forms/create_new_user/create_new_user_widget.dart';
import '/modals/sure_logout/sure_logout_widget.dart';
import '/notused/nav_button/nav_button_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'dispatcher_calllogs_widget.dart' show DispatcherCalllogsWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:text_search/text_search.dart';

class DispatcherCalllogsModel
    extends FlutterFlowModel<DispatcherCalllogsWidget> {
  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in dispatcher-calllogs widget.
  VolunteersRecord? userLoggedIn;
  // Model for NavButton component.
  late NavButtonModel navButtonModel1;
  // Model for NavButton component.
  late NavButtonModel navButtonModel2;
  // Model for NavButton component.
  late NavButtonModel navButtonModel3;
  // Model for NavButton component.
  late NavButtonModel navButtonModel4;
  // Model for NavButton component.
  late NavButtonModel navButtonModel5;
  // Model for NavButton component.
  late NavButtonModel navButtonModel6;
  // Model for NavButton component.
  late NavButtonModel navButtonModel7;
  // Model for NavButton component.
  late NavButtonModel navButtonModel8;
  // Model for NavButton component.
  late NavButtonModel navButtonModel9;
  // Model for NavButton component.
  late NavButtonModel navButtonModel10;
  // Model for NavButton component.
  late NavButtonModel navButtonModel11;
  // Model for NavButton component.
  late NavButtonModel navButtonModel12;
  // Model for NavButton component.
  late NavButtonModel navButtonModel13;
  // Model for NavButton component.
  late NavButtonModel navButtonModel14;
  // Model for NavButton component.
  late NavButtonModel navButtonModel15;
  // Model for NavButton component.
  late NavButtonModel navButtonModel16;
  // Model for NavButton component.
  late NavButtonModel navButtonModel17;
  // State field(s) for role-DropDown widget.
  String? roleDropDownValue;
  FormFieldController<String>? roleDropDownValueController;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController1;
  String? Function(BuildContext, String?)? textController1Validator;
  List<CalllogsRecord> simpleSearchResults1 = [];
  List<CalllogsRecord> simpleSearchResults2 = [];
  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController2;
  String? Function(BuildContext, String?)? textController2Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
  // State field(s) for PaginatedDataTable widget.
  final paginatedDataTableController =
      FlutterFlowDataTableController<CalllogsRecord>();

  @override
  void initState(BuildContext context) {
    navButtonModel1 = createModel(context, () => NavButtonModel());
    navButtonModel2 = createModel(context, () => NavButtonModel());
    navButtonModel3 = createModel(context, () => NavButtonModel());
    navButtonModel4 = createModel(context, () => NavButtonModel());
    navButtonModel5 = createModel(context, () => NavButtonModel());
    navButtonModel6 = createModel(context, () => NavButtonModel());
    navButtonModel7 = createModel(context, () => NavButtonModel());
    navButtonModel8 = createModel(context, () => NavButtonModel());
    navButtonModel9 = createModel(context, () => NavButtonModel());
    navButtonModel10 = createModel(context, () => NavButtonModel());
    navButtonModel11 = createModel(context, () => NavButtonModel());
    navButtonModel12 = createModel(context, () => NavButtonModel());
    navButtonModel13 = createModel(context, () => NavButtonModel());
    navButtonModel14 = createModel(context, () => NavButtonModel());
    navButtonModel15 = createModel(context, () => NavButtonModel());
    navButtonModel16 = createModel(context, () => NavButtonModel());
    navButtonModel17 = createModel(context, () => NavButtonModel());
  }

  @override
  void dispose() {
    navButtonModel1.dispose();
    navButtonModel2.dispose();
    navButtonModel3.dispose();
    navButtonModel4.dispose();
    navButtonModel5.dispose();
    navButtonModel6.dispose();
    navButtonModel7.dispose();
    navButtonModel8.dispose();
    navButtonModel9.dispose();
    navButtonModel10.dispose();
    navButtonModel11.dispose();
    navButtonModel12.dispose();
    navButtonModel13.dispose();
    navButtonModel14.dispose();
    navButtonModel15.dispose();
    navButtonModel16.dispose();
    navButtonModel17.dispose();
    textFieldFocusNode1?.dispose();
    textController1?.dispose();

    textFieldFocusNode2?.dispose();
    textController2?.dispose();

    paginatedDataTableController.dispose();
  }
}

import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_checkbox_group.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/forms/create_new_client/create_new_client_widget.dart';
import '/forms/create_new_ride/create_new_ride_widget.dart';
import '/forms/create_new_user/create_new_user_widget.dart';
import '/modals/sure_logout/sure_logout_widget.dart';
import '/notused/nav_button/nav_button_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'admin_org_info_widget.dart' show AdminOrgInfoWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class AdminOrgInfoModel extends FlutterFlowModel<AdminOrgInfoWidget> {
  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in admin-org_info widget.
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
  // Model for NavButton component.
  late NavButtonModel navButtonModel18;
  // Model for NavButton component.
  late NavButtonModel navButtonModel19;
  // Model for NavButton component.
  late NavButtonModel navButtonModel20;
  // Model for NavButton component.
  late NavButtonModel navButtonModel21;
  // Model for NavButton component.
  late NavButtonModel navButtonModel22;
  // State field(s) for role-DropDown widget.
  String? roleDropDownValue;
  FormFieldController<String>? roleDropDownValueController;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController1;
  String? Function(BuildContext, String?)? textController1Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController2;
  String? Function(BuildContext, String?)? textController2Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController3;
  String? Function(BuildContext, String?)? textController3Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode4;
  TextEditingController? textController4;
  String? Function(BuildContext, String?)? textController4Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode5;
  TextEditingController? textController5;
  String? Function(BuildContext, String?)? textController5Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode6;
  TextEditingController? textController6;
  String? Function(BuildContext, String?)? textController6Validator;
  // State field(s) for TabBar widget.
  TabController? tabBarController;
  int get tabBarCurrentIndex =>
      tabBarController != null ? tabBarController!.index : 0;
  int get tabBarPreviousIndex =>
      tabBarController != null ? tabBarController!.previousIndex : 0;

  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode7;
  TextEditingController? textController7;
  String? Function(BuildContext, String?)? textController7Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode8;
  TextEditingController? textController8;
  String? Function(BuildContext, String?)? textController8Validator;
  // State field(s) for type_of_volunteering widget.
  FocusNode? typeOfVolunteeringFocusNode;
  TextEditingController? typeOfVolunteeringTextController;
  String? Function(BuildContext, String?)?
      typeOfVolunteeringTextControllerValidator;
  // State field(s) for mobility_assistance widget.
  FocusNode? mobilityAssistanceFocusNode;
  TextEditingController? mobilityAssistanceTextController;
  String? Function(BuildContext, String?)?
      mobilityAssistanceTextControllerValidator;
  // State field(s) for CheckboxGroup widget.
  FormFieldController<List<String>>? checkboxGroupValueController;
  List<String>? get checkboxGroupValues => checkboxGroupValueController?.value;
  set checkboxGroupValues(List<String>? v) =>
      checkboxGroupValueController?.value = v;

  // State field(s) for Checkbox widget.
  bool? checkboxValue;

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
    navButtonModel18 = createModel(context, () => NavButtonModel());
    navButtonModel19 = createModel(context, () => NavButtonModel());
    navButtonModel20 = createModel(context, () => NavButtonModel());
    navButtonModel21 = createModel(context, () => NavButtonModel());
    navButtonModel22 = createModel(context, () => NavButtonModel());
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
    navButtonModel18.dispose();
    navButtonModel19.dispose();
    navButtonModel20.dispose();
    navButtonModel21.dispose();
    navButtonModel22.dispose();
    textFieldFocusNode1?.dispose();
    textController1?.dispose();

    textFieldFocusNode2?.dispose();
    textController2?.dispose();

    textFieldFocusNode3?.dispose();
    textController3?.dispose();

    textFieldFocusNode4?.dispose();
    textController4?.dispose();

    textFieldFocusNode5?.dispose();
    textController5?.dispose();

    textFieldFocusNode6?.dispose();
    textController6?.dispose();

    tabBarController?.dispose();
    textFieldFocusNode7?.dispose();
    textController7?.dispose();

    textFieldFocusNode8?.dispose();
    textController8?.dispose();

    typeOfVolunteeringFocusNode?.dispose();
    typeOfVolunteeringTextController?.dispose();

    mobilityAssistanceFocusNode?.dispose();
    mobilityAssistanceTextController?.dispose();
  }
}

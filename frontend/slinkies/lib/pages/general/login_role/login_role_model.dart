import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import 'dart:math';
import 'dart:ui';
import '/index.dart';
import 'login_role_widget.dart' show LoginRoleWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class LoginRoleModel extends FlutterFlowModel<LoginRoleWidget> {
  ///  Local state fields for this page.

  String? roleSelected;

  List<String> rolesAvailable = [];
  void addToRolesAvailable(String item) => rolesAvailable.add(item);
  void removeFromRolesAvailable(String item) => rolesAvailable.remove(item);
  void removeAtIndexFromRolesAvailable(int index) =>
      rolesAvailable.removeAt(index);
  void insertAtIndexInRolesAvailable(int index, String item) =>
      rolesAvailable.insert(index, item);
  void updateRolesAvailableAtIndex(int index, Function(String) updateFn) =>
      rolesAvailable[index] = updateFn(rolesAvailable[index]);

  String? parentRole = '';

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Backend Call - API (getRoles)] action in loginRole widget.
  ApiCallResponse? getOrgInfo;
  // State field(s) for role-dropdown widget.
  String? roleDropdownValue;
  FormFieldController<String>? roleDropdownValueController;
  // Stores action output result for [Backend Call - API (getParentRole)] action in Button widget.
  ApiCallResponse? getParent;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}

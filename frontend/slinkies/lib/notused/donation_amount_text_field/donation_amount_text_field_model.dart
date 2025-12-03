import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'donation_amount_text_field_widget.dart'
    show DonationAmountTextFieldWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class DonationAmountTextFieldModel
    extends FlutterFlowModel<DonationAmountTextFieldWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for donoAmount widget.
  FocusNode? donoAmountFocusNode;
  TextEditingController? donoAmountTextController;
  String? Function(BuildContext, String?)? donoAmountTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    donoAmountFocusNode?.dispose();
    donoAmountTextController?.dispose();
  }
}

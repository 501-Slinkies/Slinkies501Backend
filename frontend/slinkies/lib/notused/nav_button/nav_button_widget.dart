import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'nav_button_model.dart';
export 'nav_button_model.dart';

class NavButtonWidget extends StatefulWidget {
  const NavButtonWidget({
    super.key,
    required this.pageName,
    bool? active,
    required this.destination,
  }) : this.active = active ?? false;

  final String? pageName;
  final bool active;
  final Future Function()? destination;

  @override
  State<NavButtonWidget> createState() => _NavButtonWidgetState();
}

class _NavButtonWidgetState extends State<NavButtonWidget> {
  late NavButtonModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => NavButtonModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      splashColor: Colors.transparent,
      focusColor: Colors.transparent,
      hoverColor: Colors.transparent,
      highlightColor: Colors.transparent,
      onTap: () async {
        await widget.destination?.call();
      },
      child: Container(
        width: double.infinity,
        height: 50.0,
        decoration: BoxDecoration(
          color: valueOrDefault<Color>(
            widget!.active
                ? FlutterFlowTheme.of(context).navButtonClicked
                : FlutterFlowTheme.of(context).navButtonUnclicked,
            FlutterFlowTheme.of(context).navButtonUnclicked,
          ),
          borderRadius: BorderRadius.circular(5.0),
          shape: BoxShape.rectangle,
        ),
        child: Padding(
          padding: EdgeInsetsDirectional.fromSTEB(12.0, 0.0, 12.0, 0.0),
          child: Row(
            mainAxisSize: MainAxisSize.max,
            children: [
              Padding(
                padding: EdgeInsetsDirectional.fromSTEB(0.0, 12.0, 12.0, 12.0),
                child: Container(
                  width: 4.0,
                  height: 100.0,
                  decoration: BoxDecoration(
                    color: valueOrDefault<Color>(
                      widget!.active
                          ? Colors.white
                          : FlutterFlowTheme.of(context).navBarButtonIndicator,
                      FlutterFlowTheme.of(context).navBarButtonIndicator,
                    ),
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                ),
              ),
              Align(
                alignment: AlignmentDirectional(0.0, 0.0),
                child: Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(12.0, 0.0, 0.0, 0.0),
                  child: Text(
                    valueOrDefault<String>(
                      widget!.pageName,
                      'Name',
                    ),
                    style: FlutterFlowTheme.of(context).titleSmall.override(
                          font: GoogleFonts.inter(
                            fontWeight: FontWeight.w500,
                            fontStyle: FlutterFlowTheme.of(context)
                                .titleSmall
                                .fontStyle,
                          ),
                          color: valueOrDefault<Color>(
                            widget!.active
                                ? Colors.white
                                : FlutterFlowTheme.of(context)
                                    .navTitleUnclicked,
                            FlutterFlowTheme.of(context).navTitleUnclicked,
                          ),
                          fontSize: 16.0,
                          letterSpacing: 0.0,
                          fontWeight: FontWeight.w500,
                          fontStyle:
                              FlutterFlowTheme.of(context).titleSmall.fontStyle,
                        ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:page_transition/page_transition.dart';
import 'package:provider/provider.dart';
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';

import '/auth/base_auth_user_provider.dart';

import '/main.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/lat_lng.dart';
import '/flutter_flow/place.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'serialization_util.dart';

import '/index.dart';

export 'package:go_router/go_router.dart';
export 'serialization_util.dart';

const kTransitionInfoKey = '__transition_info__';

GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

class AppStateNotifier extends ChangeNotifier {
  AppStateNotifier._();

  static AppStateNotifier? _instance;
  static AppStateNotifier get instance => _instance ??= AppStateNotifier._();

  BaseAuthUser? initialUser;
  BaseAuthUser? user;
  bool showSplashImage = true;
  String? _redirectLocation;

  /// Determines whether the app will refresh and build again when a sign
  /// in or sign out happens. This is useful when the app is launched or
  /// on an unexpected logout. However, this must be turned off when we
  /// intend to sign in/out and then navigate or perform any actions after.
  /// Otherwise, this will trigger a refresh and interrupt the action(s).
  bool notifyOnAuthChange = true;

  bool get loading => user == null || showSplashImage;
  bool get loggedIn => user?.loggedIn ?? false;
  bool get initiallyLoggedIn => initialUser?.loggedIn ?? false;
  bool get shouldRedirect => loggedIn && _redirectLocation != null;

  String getRedirectLocation() => _redirectLocation!;
  bool hasRedirect() => _redirectLocation != null;
  void setRedirectLocationIfUnset(String loc) => _redirectLocation ??= loc;
  void clearRedirectLocation() => _redirectLocation = null;

  /// Mark as not needing to notify on a sign in / out when we intend
  /// to perform subsequent actions (such as navigation) afterwards.
  void updateNotifyOnAuthChange(bool notify) => notifyOnAuthChange = notify;

  void update(BaseAuthUser newUser) {
    final shouldUpdate =
        user?.uid == null || newUser.uid == null || user?.uid != newUser.uid;
    initialUser ??= newUser;
    user = newUser;
    // Refresh the app on auth change unless explicitly marked otherwise.
    // No need to update unless the user has changed.
    if (notifyOnAuthChange && shouldUpdate) {
      notifyListeners();
    }
    // Once again mark the notifier as needing to update on auth change
    // (in order to catch sign in / out events).
    updateNotifyOnAuthChange(true);
  }

  void stopShowingSplashImage() {
    showSplashImage = false;
    notifyListeners();
  }
}

GoRouter createRouter(AppStateNotifier appStateNotifier) => GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      refreshListenable: appStateNotifier,
      navigatorKey: appNavigatorKey,
      errorBuilder: (context, state) =>
          appStateNotifier.loggedIn ? AdminDashboardWidget() : LoginWidget(),
      routes: [
        FFRoute(
          name: '_initialize',
          path: '/',
          builder: (context, _) => appStateNotifier.loggedIn
              ? AdminDashboardWidget()
              : LoginWidget(),
        ),
        FFRoute(
          name: AdminDashboardWidget.routeName,
          path: AdminDashboardWidget.routePath,
          builder: (context, params) => AdminDashboardWidget(),
        ),
        FFRoute(
          name: LoginWidget.routeName,
          path: LoginWidget.routePath,
          builder: (context, params) => LoginWidget(
            postLoginResults: params.getParam(
              'postLoginResults',
              ParamType.JSON,
            ),
          ),
        ),
        FFRoute(
          name: AdminBoilerplateWidget.routeName,
          path: AdminBoilerplateWidget.routePath,
          builder: (context, params) => AdminBoilerplateWidget(),
        ),
        FFRoute(
          name: AdminSubmitUnavailabilityWidget.routeName,
          path: AdminSubmitUnavailabilityWidget.routePath,
          builder: (context, params) => AdminSubmitUnavailabilityWidget(),
        ),
        FFRoute(
          name: SuperAdminDashboardWidget.routeName,
          path: SuperAdminDashboardWidget.routePath,
          builder: (context, params) => SuperAdminDashboardWidget(),
        ),
        FFRoute(
          name: SuperAdminNeworgWidget.routeName,
          path: SuperAdminNeworgWidget.routePath,
          builder: (context, params) => SuperAdminNeworgWidget(),
        ),
        FFRoute(
          name: AdminClientsWidget.routeName,
          path: AdminClientsWidget.routePath,
          builder: (context, params) => AdminClientsWidget(),
        ),
        FFRoute(
          name: AdminAllusersWidget.routeName,
          path: AdminAllusersWidget.routePath,
          builder: (context, params) => AdminAllusersWidget(),
        ),
        FFRoute(
          name: AdminAllRequestsWidget.routeName,
          path: AdminAllRequestsWidget.routePath,
          builder: (context, params) => AdminAllRequestsWidget(),
        ),
        FFRoute(
          name: AdminCalllogsWidget.routeName,
          path: AdminCalllogsWidget.routePath,
          builder: (context, params) => AdminCalllogsWidget(),
        ),
        FFRoute(
          name: AdminDriversWidget.routeName,
          path: AdminDriversWidget.routePath,
          builder: (context, params) => AdminDriversWidget(),
        ),
        FFRoute(
          name: DriverMyridesWidget.routeName,
          path: DriverMyridesWidget.routePath,
          builder: (context, params) => DriverMyridesWidget(),
        ),
        FFRoute(
          name: DriverUnassignedRequestsWidget.routeName,
          path: DriverUnassignedRequestsWidget.routePath,
          builder: (context, params) => DriverUnassignedRequestsWidget(),
        ),
        FFRoute(
          name: AdminSecurityDefinitionsWidget.routeName,
          path: AdminSecurityDefinitionsWidget.routePath,
          builder: (context, params) => AdminSecurityDefinitionsWidget(),
        ),
        FFRoute(
          name: AdminSubmitTimeWidget.routeName,
          path: AdminSubmitTimeWidget.routePath,
          builder: (context, params) => AdminSubmitTimeWidget(),
        ),
        FFRoute(
          name: AdminReportsWidget.routeName,
          path: AdminReportsWidget.routePath,
          builder: (context, params) => AdminReportsWidget(),
        ),
        FFRoute(
          name: AdminDestinationLibraryWidget.routeName,
          path: AdminDestinationLibraryWidget.routePath,
          builder: (context, params) => AdminDestinationLibraryWidget(),
        ),
        FFRoute(
          name: ProfileWidget.routeName,
          path: ProfileWidget.routePath,
          builder: (context, params) => ProfileWidget(),
        ),
        FFRoute(
          name: EditProfileWidget.routeName,
          path: EditProfileWidget.routePath,
          builder: (context, params) => EditProfileWidget(),
        ),
        FFRoute(
          name: ForgotPasswordWidget.routeName,
          path: ForgotPasswordWidget.routePath,
          builder: (context, params) => ForgotPasswordWidget(),
        ),
        FFRoute(
          name: ResetPasswordWidget.routeName,
          path: ResetPasswordWidget.routePath,
          builder: (context, params) => ResetPasswordWidget(),
        ),
        FFRoute(
          name: DriverSubmitUnavailabilityWidget.routeName,
          path: DriverSubmitUnavailabilityWidget.routePath,
          builder: (context, params) => DriverSubmitUnavailabilityWidget(),
        ),
        FFRoute(
          name: AdminCalendarWidget.routeName,
          path: AdminCalendarWidget.routePath,
          builder: (context, params) => AdminCalendarWidget(),
        ),
        FFRoute(
          name: AdminUserManagementWidget.routeName,
          path: AdminUserManagementWidget.routePath,
          builder: (context, params) => AdminUserManagementWidget(),
        ),
        FFRoute(
          name: DispatcherSubmitUnavailabilityWidget.routeName,
          path: DispatcherSubmitUnavailabilityWidget.routePath,
          builder: (context, params) => DispatcherSubmitUnavailabilityWidget(),
        ),
        FFRoute(
          name: DriverCompletemyridesWidget.routeName,
          path: DriverCompletemyridesWidget.routePath,
          builder: (context, params) => DriverCompletemyridesWidget(),
        ),
        FFRoute(
          name: AdminOrgInfoWidget.routeName,
          path: AdminOrgInfoWidget.routePath,
          builder: (context, params) => AdminOrgInfoWidget(),
        ),
        FFRoute(
          name: DispatcherDriversWidget.routeName,
          path: DispatcherDriversWidget.routePath,
          builder: (context, params) => DispatcherDriversWidget(),
        ),
        FFRoute(
          name: DispatcherClientsWidget.routeName,
          path: DispatcherClientsWidget.routePath,
          builder: (context, params) => DispatcherClientsWidget(),
        ),
        FFRoute(
          name: SuperAdminAuditLogWidget.routeName,
          path: SuperAdminAuditLogWidget.routePath,
          builder: (context, params) => SuperAdminAuditLogWidget(),
        ),
        FFRoute(
          name: DispatcherVolunteersWidget.routeName,
          path: DispatcherVolunteersWidget.routePath,
          builder: (context, params) => DispatcherVolunteersWidget(),
        ),
        FFRoute(
          name: AdminCalendarAssignedWidget.routeName,
          path: AdminCalendarAssignedWidget.routePath,
          builder: (context, params) => AdminCalendarAssignedWidget(),
        ),
        FFRoute(
          name: AdminCalendarUnassignedWidget.routeName,
          path: AdminCalendarUnassignedWidget.routePath,
          builder: (context, params) => AdminCalendarUnassignedWidget(),
        ),
        FFRoute(
          name: AdminCalendarCancelledWidget.routeName,
          path: AdminCalendarCancelledWidget.routePath,
          builder: (context, params) => AdminCalendarCancelledWidget(),
        ),
        FFRoute(
          name: AdminCalendarCompleteWidget.routeName,
          path: AdminCalendarCompleteWidget.routePath,
          builder: (context, params) => AdminCalendarCompleteWidget(),
        ),
        FFRoute(
          name: DispatcherCalllogsWidget.routeName,
          path: DispatcherCalllogsWidget.routePath,
          builder: (context, params) => DispatcherCalllogsWidget(),
        ),
        FFRoute(
          name: DispatcherDestinationLibraryWidget.routeName,
          path: DispatcherDestinationLibraryWidget.routePath,
          builder: (context, params) => DispatcherDestinationLibraryWidget(),
        ),
        FFRoute(
          name: DispatcherAllRequestsWidget.routeName,
          path: DispatcherAllRequestsWidget.routePath,
          builder: (context, params) => DispatcherAllRequestsWidget(),
        ),
        FFRoute(
          name: DispatcherUserManagementWidget.routeName,
          path: DispatcherUserManagementWidget.routePath,
          builder: (context, params) => DispatcherUserManagementWidget(),
        ),
        FFRoute(
          name: DriverCalendarWidget.routeName,
          path: DriverCalendarWidget.routePath,
          builder: (context, params) => DriverCalendarWidget(),
        ),
        FFRoute(
          name: LoginRoleWidget.routeName,
          path: LoginRoleWidget.routePath,
          asyncParams: {
            'userLogged': getDoc(['volunteers'], VolunteersRecord.fromSnapshot),
          },
          builder: (context, params) => LoginRoleWidget(
            userLogged: params.getParam(
              'userLogged',
              ParamType.Document,
            ),
            userRef: params.getParam(
              'userRef',
              ParamType.DocumentReference,
              isList: false,
              collectionNamePath: ['volunteers'],
            ),
            volunteerID: params.getParam(
              'volunteerID',
              ParamType.String,
            ),
            orgid: params.getParam(
              'orgid',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: DriverSubmitTimeWidget.routeName,
          path: DriverSubmitTimeWidget.routePath,
          builder: (context, params) => DriverSubmitTimeWidget(),
        )
      ].map((r) => r.toRoute(appStateNotifier)).toList(),
    );

extension NavParamExtensions on Map<String, String?> {
  Map<String, String> get withoutNulls => Map.fromEntries(
        entries
            .where((e) => e.value != null)
            .map((e) => MapEntry(e.key, e.value!)),
      );
}

extension NavigationExtensions on BuildContext {
  void goNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : goNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void pushNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : pushNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void safePop() {
    // If there is only one route on the stack, navigate to the initial
    // page instead of popping.
    if (canPop()) {
      pop();
    } else {
      go('/');
    }
  }
}

extension GoRouterExtensions on GoRouter {
  AppStateNotifier get appState => AppStateNotifier.instance;
  void prepareAuthEvent([bool ignoreRedirect = false]) =>
      appState.hasRedirect() && !ignoreRedirect
          ? null
          : appState.updateNotifyOnAuthChange(false);
  bool shouldRedirect(bool ignoreRedirect) =>
      !ignoreRedirect && appState.hasRedirect();
  void clearRedirectLocation() => appState.clearRedirectLocation();
  void setRedirectLocationIfUnset(String location) =>
      appState.updateNotifyOnAuthChange(false);
}

extension _GoRouterStateExtensions on GoRouterState {
  Map<String, dynamic> get extraMap =>
      extra != null ? extra as Map<String, dynamic> : {};
  Map<String, dynamic> get allParams => <String, dynamic>{}
    ..addAll(pathParameters)
    ..addAll(uri.queryParameters)
    ..addAll(extraMap);
  TransitionInfo get transitionInfo => extraMap.containsKey(kTransitionInfoKey)
      ? extraMap[kTransitionInfoKey] as TransitionInfo
      : TransitionInfo.appDefault();
}

class FFParameters {
  FFParameters(this.state, [this.asyncParams = const {}]);

  final GoRouterState state;
  final Map<String, Future<dynamic> Function(String)> asyncParams;

  Map<String, dynamic> futureParamValues = {};

  // Parameters are empty if the params map is empty or if the only parameter
  // present is the special extra parameter reserved for the transition info.
  bool get isEmpty =>
      state.allParams.isEmpty ||
      (state.allParams.length == 1 &&
          state.extraMap.containsKey(kTransitionInfoKey));
  bool isAsyncParam(MapEntry<String, dynamic> param) =>
      asyncParams.containsKey(param.key) && param.value is String;
  bool get hasFutures => state.allParams.entries.any(isAsyncParam);
  Future<bool> completeFutures() => Future.wait(
        state.allParams.entries.where(isAsyncParam).map(
          (param) async {
            final doc = await asyncParams[param.key]!(param.value)
                .onError((_, __) => null);
            if (doc != null) {
              futureParamValues[param.key] = doc;
              return true;
            }
            return false;
          },
        ),
      ).onError((_, __) => [false]).then((v) => v.every((e) => e));

  dynamic getParam<T>(
    String paramName,
    ParamType type, {
    bool isList = false,
    List<String>? collectionNamePath,
    StructBuilder<T>? structBuilder,
  }) {
    if (futureParamValues.containsKey(paramName)) {
      return futureParamValues[paramName];
    }
    if (!state.allParams.containsKey(paramName)) {
      return null;
    }
    final param = state.allParams[paramName];
    // Got parameter from `extras`, so just directly return it.
    if (param is! String) {
      return param;
    }
    // Return serialized value.
    return deserializeParam<T>(
      param,
      type,
      isList,
      collectionNamePath: collectionNamePath,
      structBuilder: structBuilder,
    );
  }
}

class FFRoute {
  const FFRoute({
    required this.name,
    required this.path,
    required this.builder,
    this.requireAuth = false,
    this.asyncParams = const {},
    this.routes = const [],
  });

  final String name;
  final String path;
  final bool requireAuth;
  final Map<String, Future<dynamic> Function(String)> asyncParams;
  final Widget Function(BuildContext, FFParameters) builder;
  final List<GoRoute> routes;

  GoRoute toRoute(AppStateNotifier appStateNotifier) => GoRoute(
        name: name,
        path: path,
        redirect: (context, state) {
          if (appStateNotifier.shouldRedirect) {
            final redirectLocation = appStateNotifier.getRedirectLocation();
            appStateNotifier.clearRedirectLocation();
            return redirectLocation;
          }

          if (requireAuth && !appStateNotifier.loggedIn) {
            appStateNotifier.setRedirectLocationIfUnset(state.uri.toString());
            return '/login';
          }
          return null;
        },
        pageBuilder: (context, state) {
          fixStatusBarOniOS16AndBelow(context);
          final ffParams = FFParameters(state, asyncParams);
          final page = ffParams.hasFutures
              ? FutureBuilder(
                  future: ffParams.completeFutures(),
                  builder: (context, _) => builder(context, ffParams),
                )
              : builder(context, ffParams);
          final child = appStateNotifier.loading
              ? Center(
                  child: SizedBox(
                    width: 50.0,
                    height: 50.0,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        FlutterFlowTheme.of(context).primary,
                      ),
                    ),
                  ),
                )
              : page;

          final transitionInfo = state.transitionInfo;
          return transitionInfo.hasTransition
              ? CustomTransitionPage(
                  key: state.pageKey,
                  child: child,
                  transitionDuration: transitionInfo.duration,
                  transitionsBuilder:
                      (context, animation, secondaryAnimation, child) =>
                          PageTransition(
                    type: transitionInfo.transitionType,
                    duration: transitionInfo.duration,
                    reverseDuration: transitionInfo.duration,
                    alignment: transitionInfo.alignment,
                    child: child,
                  ).buildTransitions(
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ),
                )
              : MaterialPage(key: state.pageKey, child: child);
        },
        routes: routes,
      );
}

class TransitionInfo {
  const TransitionInfo({
    required this.hasTransition,
    this.transitionType = PageTransitionType.fade,
    this.duration = const Duration(milliseconds: 300),
    this.alignment,
  });

  final bool hasTransition;
  final PageTransitionType transitionType;
  final Duration duration;
  final Alignment? alignment;

  static TransitionInfo appDefault() => TransitionInfo(hasTransition: false);
}

class RootPageContext {
  const RootPageContext(this.isRootPage, [this.errorRoute]);
  final bool isRootPage;
  final String? errorRoute;

  static bool isInactiveRootPage(BuildContext context) {
    final rootPageContext = context.read<RootPageContext?>();
    final isRootPage = rootPageContext?.isRootPage ?? false;
    final location = GoRouterState.of(context).uri.toString();
    return isRootPage &&
        location != '/' &&
        location != rootPageContext?.errorRoute;
  }

  static Widget wrap(Widget child, {String? errorRoute}) => Provider.value(
        value: RootPageContext(true, errorRoute),
        child: child,
      );
}

extension GoRouterLocationExtension on GoRouter {
  String getCurrentLocation() {
    final RouteMatch lastMatch = routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = lastMatch is ImperativeRouteMatch
        ? lastMatch.matches
        : routerDelegate.currentConfiguration;
    return matchList.uri.toString();
  }
}

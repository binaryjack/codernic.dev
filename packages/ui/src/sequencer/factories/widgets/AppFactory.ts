export class AppFactory {
  static createDispatchActions() {
    return [
      {
        type: 'app/setWorkspaceName',
        payload: 'Demo Workspace'
      },
      {
        type: 'app/setDaemonIsLoaded',
        payload: true
      }
    ];
  }
}

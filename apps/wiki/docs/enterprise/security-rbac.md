# Security, SAML, & RBAC

Codernic Enterprise integrates deeply with your corporate Identity Provider (IdP) to enforce strict Role-Based Access Control (RBAC) and Single Sign-On (SSO).

## Identity Providers (IdP)

Codernic supports standard OIDC (OpenID Connect) and SAML protocols. It has been tested with:
- **Microsoft Entra ID (Azure AD)**
- **Okta**
- **Auth0**
- **Ping Identity**

### How to Configure

Authentication is handled primarily by the **Pirsig Shield Proxy** and the Codernic UI login gate. 

1. **Proxy OIDC Configuration:**
   The Proxy requires your corporate OIDC issuer URL. It will automatically fetch the JSON Web Key Sets (JWKS) to mathematically verify incoming JWT signatures without making a network round-trip for every request.
   
   ```bash
   export OIDC_ISSUER="https://your-corp.okta.com"
   ```

2. **Frontend UI Configuration:**
   In the near future, the UI will feature an **Enterprise Settings** panel where administrators can visually map IdP roles to Codernic roles. Currently, configuration is managed via the `engine.json` network block or via Environment Variables during deployment.

## Role-Based Access Control (RBAC)

By default, the proxy strictly gates AI access based on JWT payload claims.

### The `pirsig_user` Role
When a developer authenticates via Entra ID or Okta, their JWT token must include a specific claim asserting they are allowed to use corporate AI budgets. 

If the proxy decodes the JWT and does not find the mapped role, it will return an HTTP `403 Forbidden`, blocking the local Codernic daemon from routing LLM requests to the cloud.

### Future: Admin UI
In upcoming releases, the Codernic UI will feature an Enterprise Admin Dashboard to:
- Visually configure SAML/IdP connections.
- Map custom Active Directory groups to Codernic licenses (e.g., mapping `AD_Devs_Senior` to the `Architect` tier).
- Revoke access instantly for specific tokens or IP ranges.

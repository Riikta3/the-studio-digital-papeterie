export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      custom_oauth_providers: {
        Row: {
          acceptable_client_ids: string[]
          attribute_mapping: Json
          authorization_params: Json
          authorization_url: string | null
          cached_discovery: Json | null
          client_id: string
          client_secret: string
          created_at: string
          discovery_cached_at: string | null
          discovery_url: string | null
          email_optional: boolean
          enabled: boolean
          id: string
          identifier: string
          issuer: string | null
          jwks_uri: string | null
          name: string
          pkce_enabled: boolean
          provider_type: string
          scopes: string[]
          skip_nonce_check: boolean
          token_url: string | null
          updated_at: string
          userinfo_url: string | null
        }
        Insert: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id: string
          client_secret: string
          created_at?: string
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier: string
          issuer?: string | null
          jwks_uri?: string | null
          name: string
          pkce_enabled?: boolean
          provider_type: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Update: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id?: string
          client_secret?: string
          created_at?: string
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier?: string
          issuer?: string | null
          jwks_uri?: string | null
          name?: string
          pkce_enabled?: boolean
          provider_type?: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string | null
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string | null
          email_optional: boolean
          id: string
          invite_token: string | null
          linking_target_id: string | null
          oauth_client_state_id: string | null
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          referrer: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id?: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_client_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Insert: {
          code_verifier?: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          id?: string
          provider_type?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          booking_url: string | null
          city: string | null
          created_at: string
          distance: string | null
          id: string
          name: string
          offer: string | null
          phone: string | null
          photo_url: string | null
          position: number | null
          wedding_id: string
        }
        Insert: {
          booking_url?: string | null
          city?: string | null
          created_at?: string
          distance?: string | null
          id?: string
          name: string
          offer?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: number | null
          wedding_id: string
        }
        Update: {
          booking_url?: string | null
          city?: string | null
          created_at?: string
          distance?: string | null
          id?: string
          name?: string
          offer?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: number | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      billing: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          invoice_url: string | null
          payment_method: string | null
          plan_name: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_attempts: {
        Row: {
          attempted_at: string
          email_hash: string
          id: number
        }
        Insert: {
          attempted_at?: string
          email_hash: string
          id?: number
        }
        Update: {
          attempted_at?: string
          email_hash?: string
          id?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          collection: string | null
          consent_at: string | null
          created_at: string
          email: string
          first_name: string | null
          guest_band: string | null
          id: string
          interest: string | null
          last_name: string | null
          locale: string
          message: string
          name: string
          project_stage: string | null
          status: string
          subject: string
          wedding_date: string | null
          wedding_place: string | null
        }
        Insert: {
          collection?: string | null
          consent_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          guest_band?: string | null
          id?: string
          interest?: string | null
          last_name?: string | null
          locale: string
          message: string
          name: string
          project_stage?: string | null
          status?: string
          subject: string
          wedding_date?: string | null
          wedding_place?: string | null
        }
        Update: {
          collection?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          guest_band?: string | null
          id?: string
          interest?: string | null
          last_name?: string | null
          locale?: string
          message?: string
          name?: string
          project_stage?: string | null
          status?: string
          subject?: string
          wedding_date?: string | null
          wedding_place?: string | null
        }
        Relationships: []
      }
      day_of_settings: {
        Row: {
          after_wedding_mode: boolean | null
          created_at: string
          enabled: boolean | null
          gallery_visible_to_guests: boolean | null
          id: string
          updated_at: string
          uploads_open_until: string | null
          venue_plan_url: string | null
          wedding_id: string
        }
        Insert: {
          after_wedding_mode?: boolean | null
          created_at?: string
          enabled?: boolean | null
          gallery_visible_to_guests?: boolean | null
          id?: string
          updated_at?: string
          uploads_open_until?: string | null
          venue_plan_url?: string | null
          wedding_id: string
        }
        Update: {
          after_wedding_mode?: boolean | null
          created_at?: string
          enabled?: boolean | null
          gallery_visible_to_guests?: boolean | null
          id?: string
          updated_at?: string
          uploads_open_until?: string | null
          venue_plan_url?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_of_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_filter: Json | null
          content: string | null
          created_at: string
          id: string
          name: string
          scheduled_at: string | null
          status: string | null
          subject: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          audience_filter?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          name: string
          scheduled_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          audience_filter?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          error_message: string | null
          household_id: string | null
          id: string
          opened_at: string | null
          provider_id: string | null
          recipient_email: string
          status: string | null
          wedding_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          household_id?: string | null
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          recipient_email: string
          status?: string | null
          wedding_id: string
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          household_id?: string | null
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          recipient_email?: string
          status?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          created_at: string
          date: string | null
          description: string | null
          dress_code: string | null
          enabled: boolean | null
          id: string
          key: string
          name: string
          position: number | null
          time: string | null
          wedding_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          dress_code?: string | null
          enabled?: boolean | null
          id?: string
          key: string
          name: string
          position?: number | null
          time?: string | null
          wedding_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          dress_code?: string | null
          enabled?: boolean | null
          id?: string
          key?: string
          name?: string
          position?: number | null
          time?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_entries: {
        Row: {
          answer: string
          created_at: string
          id: string
          position: number | null
          published: boolean | null
          question: string
          wedding_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          position?: number | null
          published?: boolean | null
          question: string
          wedding_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          position?: number | null
          published?: boolean | null
          question?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_entries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_events: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string
          id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_events_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_media: {
        Row: {
          created_at: string
          hidden: boolean | null
          id: string
          kind: string
          storage_path: string
          thumb_path: string | null
          uploader_name: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean | null
          id?: string
          kind: string
          storage_path: string
          thumb_path?: string | null
          uploader_name?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          hidden?: boolean | null
          id?: string
          kind?: string
          storage_path?: string
          thumb_path?: string | null
          uploader_name?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_media_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_search_attempts: {
        Row: {
          caller_bucket: string | null
          id: number
          searched_at: string
          wedding_id: string
        }
        Insert: {
          caller_bucket?: string | null
          id?: number
          searched_at?: string
          wedding_id: string
        }
        Update: {
          caller_bucket?: string | null
          id?: number
          searched_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_search_attempts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          allergies: string | null
          created_at: string
          dietary_flags: string[] | null
          dietary_requirements: string | null
          email: string | null
          first_name: string
          guest_group: string | null
          household_id: string | null
          id: string
          is_child: boolean | null
          is_plus_one: boolean | null
          last_name: string
          meal: string | null
          notes: string | null
          phone: string | null
          relation_type: string | null
          status: string | null
          table_id: string | null
          wedding_id: string
        }
        Insert: {
          allergies?: string | null
          created_at?: string
          dietary_flags?: string[] | null
          dietary_requirements?: string | null
          email?: string | null
          first_name: string
          guest_group?: string | null
          household_id?: string | null
          id?: string
          is_child?: boolean | null
          is_plus_one?: boolean | null
          last_name: string
          meal?: string | null
          notes?: string | null
          phone?: string | null
          relation_type?: string | null
          status?: string | null
          table_id?: string | null
          wedding_id: string
        }
        Update: {
          allergies?: string | null
          created_at?: string
          dietary_flags?: string[] | null
          dietary_requirements?: string | null
          email?: string | null
          first_name?: string
          guest_group?: string | null
          household_id?: string | null
          id?: string
          is_child?: boolean | null
          is_plus_one?: boolean | null
          last_name?: string
          meal?: string | null
          notes?: string | null
          phone?: string | null
          relation_type?: string | null
          status?: string | null
          table_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          guest_group: string | null
          id: string
          last_relance_at: string | null
          magic_link_token: string | null
          message_to_couple: string | null
          name: string
          phone: string | null
          song_request: string | null
          source: string | null
          status: string | null
          transportation: string | null
          wedding_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          guest_group?: string | null
          id?: string
          last_relance_at?: string | null
          magic_link_token?: string | null
          message_to_couple?: string | null
          name: string
          phone?: string | null
          song_request?: string | null
          source?: string | null
          status?: string | null
          transportation?: string | null
          wedding_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          guest_group?: string | null
          id?: string
          last_relance_at?: string | null
          magic_link_token?: string | null
          message_to_couple?: string | null
          name?: string
          phone?: string | null
          song_request?: string | null
          source?: string | null
          status?: string | null
          transportation?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          id: string
          invoice_number: string
          issued_at: string
          line_items: Json
          pdf_path: string | null
          stripe_payment_intent_id: string
          subtotal_cents: number
          total_cents: number
          user_id: string | null
          vat_cents: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          line_items?: Json
          pdf_path?: string | null
          stripe_payment_intent_id: string
          subtotal_cents: number
          total_cents: number
          user_id?: string | null
          vat_cents?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          line_items?: Json
          pdf_path?: string | null
          stripe_payment_intent_id?: string
          subtotal_cents?: number
          total_cents?: number
          user_id?: string | null
          vat_cents?: number
          vat_rate?: number
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          key: string
          position: number | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          key: string
          position?: number | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          key?: string
          position?: number | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number | null
          variant: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number | null
          variant?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          default_order: number
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          default_order: number
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          default_order?: number
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      playlist_suggestions: {
        Row: {
          guest_name: string | null
          id: string
          submitted_at: string
          track_statuses: Json
          tracks: Json
          wedding_id: string
        }
        Insert: {
          guest_name?: string | null
          id?: string
          submitted_at?: string
          track_statuses?: Json
          tracks?: Json
          wedding_id: string
        }
        Update: {
          guest_name?: string | null
          id?: string
          submitted_at?: string
          track_statuses?: Json
          tracks?: Json
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_suggestions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_new: boolean
          last_name: string | null
          partner_name: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          is_new?: boolean
          last_name?: string | null
          partner_name?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_new?: boolean
          last_name?: string | null
          partner_name?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          state: Json | null
          status: string | null
          theme_id: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          state?: Json | null
          status?: string | null
          theme_id?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          state?: Json | null
          status?: string | null
          theme_id?: string | null
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          item_id: string
          item_type: string
          price_paid: number | null
          status: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          item_id: string
          item_type: string
          price_paid?: number | null
          status?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          item_id?: string
          item_type?: string
          price_paid?: number | null
          status?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_attempts: {
        Row: {
          attempted_at: string
          caller_bucket: string
          id: number
          kind: string
          wedding_id: string
        }
        Insert: {
          attempted_at?: string
          caller_bucket: string
          id?: number
          kind: string
          wedding_id: string
        }
        Update: {
          attempted_at?: string
          caller_bucket?: string
          id?: number
          kind?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_attempts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          admin_note: string | null
          attendance: boolean | null
          dietary: string | null
          guest_count: number
          id: string
          message: string | null
          name: string
          participants: Json | null
          respondent_first_name: string | null
          respondent_last_name: string | null
          submitted_at: string
          wedding_id: string
        }
        Insert: {
          admin_note?: string | null
          attendance?: boolean | null
          dietary?: string | null
          guest_count?: number
          id?: string
          message?: string | null
          name: string
          participants?: Json | null
          respondent_first_name?: string | null
          respondent_last_name?: string | null
          submitted_at?: string
          wedding_id: string
        }
        Update: {
          admin_note?: string | null
          attendance?: boolean | null
          dietary?: string | null
          guest_count?: number
          id?: string
          message?: string | null
          name?: string
          participants?: Json | null
          respondent_first_name?: string | null
          respondent_last_name?: string | null
          submitted_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_entries: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          position: number | null
          time: string
          title: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          position?: number | null
          time: string
          title: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          position?: number | null
          time?: string
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          adults_only: boolean
          announcement: string | null
          closing_words: string | null
          couple_photo_url: string | null
          created_at: string
          guest_code: string | null
          hero_kicker: string | null
          id: string
          is_module_accommodation_enabled: boolean | null
          is_module_gallery_enabled: boolean | null
          is_module_rsvp_meal_enabled: boolean | null
          is_module_schedule_enabled: boolean | null
          rsvp_mode: string | null
          theme_config: Json | null
          wedding_code: string | null
          wedding_id: string
        }
        Insert: {
          adults_only?: boolean
          announcement?: string | null
          closing_words?: string | null
          couple_photo_url?: string | null
          created_at?: string
          guest_code?: string | null
          hero_kicker?: string | null
          id?: string
          is_module_accommodation_enabled?: boolean | null
          is_module_gallery_enabled?: boolean | null
          is_module_rsvp_meal_enabled?: boolean | null
          is_module_schedule_enabled?: boolean | null
          rsvp_mode?: string | null
          theme_config?: Json | null
          wedding_code?: string | null
          wedding_id: string
        }
        Update: {
          adults_only?: boolean
          announcement?: string | null
          closing_words?: string | null
          couple_photo_url?: string | null
          created_at?: string
          guest_code?: string | null
          hero_kicker?: string | null
          id?: string
          is_module_accommodation_enabled?: boolean | null
          is_module_gallery_enabled?: boolean | null
          is_module_rsvp_meal_enabled?: boolean | null
          is_module_schedule_enabled?: boolean | null
          rsvp_mode?: string | null
          theme_config?: Json | null
          wedding_code?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_modules: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          module_id: string
          position: number
          site_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          module_id: string
          position: number
          site_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          module_id?: string
          position?: number
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_modules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          animation_id: string | null
          created_at: string
          domain: string | null
          extras: string[] | null
          id: string
          is_demo: boolean | null
          languages: string[] | null
          modules: string[] | null
          plan_id: string
          slug: string | null
          status: string | null
          theme_id: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          animation_id?: string | null
          created_at?: string
          domain?: string | null
          extras?: string[] | null
          id?: string
          is_demo?: boolean | null
          languages?: string[] | null
          modules?: string[] | null
          plan_id?: string
          slug?: string | null
          status?: string | null
          theme_id: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          animation_id?: string | null
          created_at?: string
          domain?: string | null
          extras?: string[] | null
          id?: string
          is_demo?: boolean | null
          languages?: string[] | null
          modules?: string[] | null
          plan_id?: string
          slug?: string | null
          status?: string | null
          theme_id?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          customer_email: string | null
          event_type: string
          id: string
          payment_intent_id: string | null
          raw_payload: Json | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          event_type: string
          id?: string
          payment_intent_id?: string | null
          raw_payload?: Json | null
          status: string
          stripe_event_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          event_type?: string
          id?: string
          payment_intent_id?: string | null
          raw_payload?: Json | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          name: string
          position: number | null
          seats_label: string | null
          shape: string | null
          wedding_id: string
          x: number | null
          x_position: number | null
          y: number | null
          y_position: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          position?: number | null
          seats_label?: string | null
          shape?: string | null
          wedding_id: string
          x?: number | null
          x_position?: number | null
          y?: number | null
          y_position?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          position?: number | null
          seats_label?: string | null
          shape?: string | null
          wedding_id?: string
          x?: number | null
          x_position?: number | null
          y?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          access_info: string | null
          address: string | null
          city: string | null
          created_at: string
          id: string
          maps_url: string | null
          name: string
          parking_info: string | null
          photo_url: string | null
          transport_info: string | null
          waze_url: string | null
          wedding_id: string
        }
        Insert: {
          access_info?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name: string
          parking_info?: string | null
          photo_url?: string | null
          transport_info?: string | null
          waze_url?: string | null
          wedding_id: string
        }
        Update: {
          access_info?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name?: string
          parking_info?: string | null
          photo_url?: string | null
          transport_info?: string | null
          waze_url?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          created_at: string
          id: string
          partner_name: string | null
          user_id: string
          wedding_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_name?: string | null
          user_id: string
          wedding_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_name?: string | null
          user_id?: string
          wedding_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_contact_rate: { Args: { p_email_hash: string }; Returns: boolean }
      check_guest_search_rate: {
        Args: { p_bucket?: string; p_wedding_id: string }
        Returns: boolean
      }
      check_rsvp_rate: {
        Args: {
          p_bucket: string
          p_kind: string
          p_limit: number
          p_wedding_id: string
          p_window: string
        }
        Returns: boolean
      }
      dashboard_counts: {
        Args: { p_wedding_id: string }
        Returns: {
          events_enabled: number
          guests_children: number
          guests_confirmed: number
          guests_declined: number
          guests_pending: number
          guests_seated: number
          guests_total: number
          media_total: number
          tables_capacity: number
          tables_total: number
        }[]
      }
      get_couple_display_names: {
        Args: { p_wedding_id: string }
        Returns: {
          first_name: string
          partner_name: string
        }[]
      }
      guest_media_count: { Args: { p_wedding_id: string }; Returns: number }
      guest_uploads_open: { Args: { p_wedding_id: string }; Returns: boolean }
      invitation_published: { Args: { p_wedding_id: string }; Returns: boolean }
      next_invoice_number: { Args: never; Returns: string }
      public_day_of_settings: {
        Args: { p_wedding_id: string }
        Returns: {
          after_wedding_mode: boolean
          enabled: boolean
          gallery_visible_to_guests: boolean
          uploads_open_until: string
          venue_plan_url: string
        }[]
      }
      public_module_configs: {
        Args: { p_wedding_id: string }
        Returns: {
          config: Json
          module_id: string
          position: number
        }[]
      }
      public_wedding_events: {
        Args: { p_wedding_id: string }
        Returns: {
          address: string
          date: string
          description: string
          dress_code: string
          id: string
          key: string
          name: string
          position: number
          time: string
        }[]
      }
      register_rsvp_household: {
        Args: {
          p_bucket: string
          p_email: string
          p_guests: Json
          p_message: string
          p_name: string
          p_song: string
          p_transport: string
          p_wedding_id: string
        }
        Returns: string
      }
      resolve_public_slug: {
        Args: { p_slug: string }
        Returns: {
          adults_only: boolean
          announcement: string
          closing_words: string
          couple_photo_url: string
          hero_kicker: string
          modules: string[]
          theme_id: string
          wedding_id: string
        }[]
      }
      resolve_wedding_code: {
        Args: { p_bucket: string; p_code: string }
        Returns: {
          couple_names: string
          wedding_id: string
        }[]
      }
      search_guest_table: {
        Args: { p_bucket?: string; p_query: string; p_wedding_id: string }
        Returns: {
          first_name: string
          last_name: string
          seats_label: string
          table_name: string
        }[]
      }
      search_rsvp_household: {
        Args: { p_bucket: string; p_query: string; p_wedding_id: string }
        Returns: {
          guests: Json
          id: string
          name: string
          status: string
        }[]
      }
      submit_contact_message: {
        Args: {
          p_collection?: string
          p_consent?: boolean
          p_email: string
          p_first_name?: string
          p_guest_band?: string
          p_interest?: string
          p_last_name?: string
          p_locale: string
          p_message: string
          p_name: string
          p_project_stage?: string
          p_subject: string
          p_wedding_date?: string
          p_wedding_place?: string
        }
        Returns: boolean
      }
      submit_rsvp_household: {
        Args: {
          p_bucket: string
          p_email: string
          p_guests: Json
          p_household_id: string
          p_message: string
          p_song: string
          p_transport: string
          p_wedding_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const


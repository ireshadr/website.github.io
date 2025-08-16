@description('Primary location for all resources')
param location string

@description('Name of the environment')
param environmentName string

@description('Resource token for unique naming')
param resourceToken string

@description('Resource prefix for naming')
param resourcePrefix string

@description('Port for the application')
param port string

@description('Node environment')
param nodeEnv string

@description('JWT secret for authentication')
@secure()
param jwtSecret string

@description('CORS origin URL')
param corsOrigin string

@description('Email user for sending notifications')
@secure()
param emailUser string

@description('Email password for SMTP')
@secure()
param emailPass string

@description('Email from address')
param emailFrom string

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'az-${resourcePrefix}-log-${resourceToken}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'az-${resourcePrefix}-ai-${resourceToken}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// User-assigned managed identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'az-${resourcePrefix}-id-${resourceToken}'
  location: location
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'az-${resourcePrefix}-kv-${resourceToken}'
  location: location
  properties: {
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    enableRbacAuthorization: true
    tenantId: tenant().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Key Vault Secrets Officer role assignment for managed identity
resource keyVaultSecretsOfficerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, managedIdentity.id, 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'
    )
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Cosmos DB account for MongoDB
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' = {
  name: 'az-${resourcePrefix}-cosmos-${resourceToken}'
  location: location
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    apiProperties: {
      serverVersion: '4.2'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
      {
        name: 'MongoDBv3.4'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    enableFreeTier: true
    publicNetworkAccess: 'Enabled'
    cors: []
  }
}

// Store secrets in Key Vault
resource mongoDbConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'MONGODB-URI'
  properties: {
    value: cosmosDbAccount.listConnectionStrings().connectionStrings[0].connectionString
  }
  dependsOn: [
    keyVaultSecretsOfficerRole
  ]
}

resource jwtSecretKv 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: jwtSecret
  }
  dependsOn: [
    keyVaultSecretsOfficerRole
  ]
}

resource emailUserSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(emailUser)) {
  parent: keyVault
  name: 'EMAIL-USER'
  properties: {
    value: emailUser
  }
  dependsOn: [
    keyVaultSecretsOfficerRole
  ]
}

resource emailPassSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(emailPass)) {
  parent: keyVault
  name: 'EMAIL-PASS'
  properties: {
    value: emailPass
  }
  dependsOn: [
    keyVaultSecretsOfficerRole
  ]
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'az-${resourcePrefix}-plan-${resourceToken}'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service for TiKaz Livré Backend
resource appService 'Microsoft.Web/sites@2024-04-01' = {
  name: 'az-${resourcePrefix}-app-${resourceToken}'
  location: location
  kind: 'app,linux'
  tags: {
    'azd-service-name': 'tikaz-livre-backend'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'PORT'
          value: port
        }
        {
          name: 'NODE_ENV'
          value: nodeEnv
        }
        {
          name: 'DB_NAME'
          value: 'tikaz_livre'
        }
        {
          name: 'CORS_ORIGIN'
          value: corsOrigin
        }
        {
          name: 'EMAIL_FROM'
          value: emailFrom
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'MONGODB_URI'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=MONGODB-URI)'
        }
        {
          name: 'JWT_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=JWT-SECRET)'
        }
        {
          name: 'EMAIL_USER'
          value: empty(emailUser) ? '' : '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=EMAIL-USER)'
        }
        {
          name: 'EMAIL_PASS'
          value: empty(emailPass) ? '' : '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=EMAIL-PASS)'
        }
      ]
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
    }
  }
  dependsOn: [
    keyVaultSecretsOfficerRole
  ]
}

// Diagnostic settings for App Service
resource appServiceDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: appService
  name: 'appservice-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Outputs
output SERVICE_BINDING_TIKAZ_LIVRE_BACKEND_ENDPOINT string = 'https://${appService.properties.defaultHostName}'
output AZURE_KEY_VAULT_NAME string = keyVault.name
output AZURE_COSMOS_DB_ACCOUNT_NAME string = cosmosDbAccount.name

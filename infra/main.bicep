targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the resource group')
param resourceGroupName string = 'rg-${environmentName}'

// Optional parameters for environment variables
@description('Port for the application')
param port string = '3000'

@description('Node environment')
param nodeEnv string = 'production'

@description('JWT secret for authentication')
@secure()
param jwtSecret string = newGuid()

@description('CORS origin URL')
param corsOrigin string = '*'

@description('Email user for sending notifications')
@secure()
param emailUser string = ''

@description('Email password for SMTP')
@secure()
param emailPass string = ''

@description('Email from address')
param emailFrom string = ''

// Generate a unique token for resource names
var resourceToken = uniqueString(subscription().id, location, environmentName)
var resourcePrefix = 'tkz'

// Create resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: {
    'azd-env-name': environmentName
  }
}

// Deploy the main resources
module resources 'resources.bicep' = {
  scope: resourceGroup
  name: 'resources'
  params: {
    location: location
    environmentName: environmentName
    resourceToken: resourceToken
    resourcePrefix: resourcePrefix
    port: port
    nodeEnv: nodeEnv
    jwtSecret: jwtSecret
    corsOrigin: corsOrigin
    emailUser: emailUser
    emailPass: emailPass
    emailFrom: emailFrom
  }
}

// Outputs
output RESOURCE_GROUP_ID string = resourceGroup.id
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output SERVICE_BINDING_TIKAZ_LIVRE_BACKEND_ENDPOINT string = resources.outputs.SERVICE_BINDING_TIKAZ_LIVRE_BACKEND_ENDPOINT

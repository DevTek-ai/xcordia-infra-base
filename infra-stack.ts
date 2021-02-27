import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';

const config = require('config');

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //-----------VPC, SUBNETS-------------
    
    const publicSubnets = [
      {
        subnetType: ec2.SubnetType.PUBLIC,
        name: 'public1',
        cidrMask: config.get("SUBNET_CIDR_MASK")
      },
      {
        subnetType: ec2.SubnetType.PUBLIC,
        name: 'public2',
        cidrMask: config.get("SUBNET_CIDR_MASK")
      },
      {
        subnetType: ec2.SubnetType.PUBLIC,
        name: 'public3',
        cidrMask: config.get("SUBNET_CIDR_MASK")
      }
    ]
    
    //cannot reach internet at all
    const isolatedSubnets = [
      {
        subnetType: ec2.SubnetType.ISOLATED,
        name: 'isolated1',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      },
      {
        subnetType: ec2.SubnetType.ISOLATED,
        name: 'isolated2',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      },
      {
        subnetType: ec2.SubnetType.ISOLATED,
        name: 'isolated3',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      }
    ]
    //private subnets can reach internet via NAT Gateway
    const privateSubnets = [
      {
        subnetType: ec2.SubnetType.PRIVATE,
        name: 'private1',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      },
      {
        subnetType: ec2.SubnetType.PRIVATE,
        name: 'private2',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      },
      {
        subnetType: ec2.SubnetType.PRIVATE,
        name: 'private3',
        cidrMask: config.get("SUBNET_CIDR_MASK"),
      }
    ]

 

    //-----------ECR-------------
    
    const ecr_repo_platform = new ecr.Repository(this, this.get_logical_env_name('ecr'), {
      repositoryName: this.get_logical_env_name('api-repo'),
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });

    
    //-----------VPC-------------
    const vpc = new ec2.Vpc(this, this.get_logical_env_name('vpc'), {

      cidr: config.get("VPC_IP"),
      natGateways: 0,
     // subnetConfiguration: [...publicSubnets, ...isolatedSubnets,...privateSubnets] //...privateSubnets,
    });

 
    //-----------RDS-------------

    const db_instance = new rds.DatabaseInstance(this, 'db-instance', {
      vpc : vpc,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_10
      }),      
      publiclyAccessible: false,
      credentials: rds.Credentials.fromGeneratedSecret(config.get('DB_USERNAME')),
      databaseName: `${config.get('DB_NAME')}`,
      instanceIdentifier: `${config.get('DB_NAME')}`,
    
    });

    new cdk.CfnOutput(this, 'DB endpoint', { value: db_instance.instanceEndpoint.hostname });
    new cdk.CfnOutput(this, 'DB name', { value: db_instance.instanceIdentifier });
    new cdk.CfnOutput(this, 'Secret Name', { value: db_instance.secret?.secretName! });



  }

  get_logical_env_name(resource_type: string): string {
    
    let val = `${config.get('PROJECT_NAME')}-${config.get('ENVIRONMENT')}`
    if (resource_type) {
      val = val + '-' + resource_type;
    }

    return val;
  }

}

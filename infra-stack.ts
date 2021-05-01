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

    var platform_repo_name = (process.env.NODE_ENV === "dev") ? "ecr_repo_platform2" : this.get_logical_env_name("ecr_repo_platform");
    const ecr_repo_platform2 = new ecr.Repository(this, this.get_logical_env_name('platform2'), {
      repositoryName: platform_repo_name,
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });
    new cdk.CfnOutput(this, "ecr_repo_platform2", { value: ecr_repo_platform2.repositoryUri });

    var document_repo_name = (process.env.NODE_ENV === "dev") ? "ecr_repo_document" : this.get_logical_env_name("ecr_repo_document");
    const ecr_repo_document = new ecr.Repository(this, this.get_logical_env_name('document'), {
      repositoryName: document_repo_name,
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });
    new cdk.CfnOutput(this, "ecr_repo_document", { value: ecr_repo_document.repositoryUri });

    var payment_repo_name = (process.env.NODE_ENV === "dev") ? "ecr_repo_payment" : this.get_logical_env_name("ecr_repo_payment");
    const ecr_repo_payment = new ecr.Repository(this, this.get_logical_env_name('payment'), {
      repositoryName: payment_repo_name,
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });
    new cdk.CfnOutput(this, "ecr_repo_payment", { value: ecr_repo_payment.repositoryUri });

    var order_repo_name = (process.env.NODE_ENV === "dev") ? "ecr_repo_order" : this.get_logical_env_name("ecr_repo_order");
    const ecr_repo_order = new ecr.Repository(this, this.get_logical_env_name('order'), {
      repositoryName: order_repo_name,
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });
    new cdk.CfnOutput(this, "order_repo_name", { value: ecr_repo_order.repositoryUri });

    const ecr_repo_shop_ui = new ecr.Repository(this, this.get_logical_env_name('ecr_repo_shop_ui'), {
      repositoryName: this.get_logical_env_name("ecr_repo_shop_ui"),
      lifecycleRules: [
        {
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          description: 'lifecycle cleanup rule'
        }
      ],
    });
    new cdk.CfnOutput(this, "ecr_repo_shop_ui", {value: ecr_repo_shop_ui.repositoryUri});
    
    //-----------VPC-------------
    const vpc = new ec2.Vpc(this, this.get_logical_env_name('vpc'), {

      cidr: config.get("VPC_IP"),
      natGateways: 0,
     // subnetConfiguration: [...publicSubnets, ...isolatedSubnets,...privateSubnets] //...privateSubnets,
    });

 
    //-----------RDS-------------
    
    //default value for dev & QA
    var db_instance_type = ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM);
    
    if (process.env.NODE_ENV === 'production') {
      db_instance_type = ec2.InstanceType.of(ec2.InstanceClass.M5,ec2.InstanceSize.LARGE);
    }    

    const db_instance = new rds.DatabaseInstance(this, 'db-instance', {
      vpc: vpc, 
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_10
      }),     
      publiclyAccessible: false,
      credentials: rds.Credentials.fromGeneratedSecret(config.get('DB_USERNAME')),
      databaseName: `${config.get('DB_NAME')}`,
      instanceIdentifier: `${config.get('DB_NAME')}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.ISOLATED,
      },
      instanceType: db_instance_type
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

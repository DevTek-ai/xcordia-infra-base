import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';

const config = require('config');

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
  }

  get_logical_env_name(resource_type: string): string {
    
    let val = `${config.get('PROJECT_NAME')}-${config.get('ENVIRONMENT')}`
    if (resource_type) {
      val = val + '-' + resource_type;
    }

    return val;
  }

}

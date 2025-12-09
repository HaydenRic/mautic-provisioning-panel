import yaml from 'js-yaml';

export interface MauticStackConfig {
  stackName: string;
  domain: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbRootPassword: string;
  mauticVersion: string;
  traefikNetwork: string;
  certResolver: string;
}

export function renderMauticStackYaml(config: MauticStackConfig): string {
  const {
    stackName,
    domain,
    dbName,
    dbUser,
    dbPassword,
    dbRootPassword,
    mauticVersion,
    traefikNetwork,
    certResolver,
  } = config;

  const sanitizedStackName = stackName.replace(/[^a-z0-9-]/gi, '-');

  const composeObject = {
    version: '3.8',
    services: {
      db: {
        image: 'mysql:8',
        environment: {
          MYSQL_ROOT_PASSWORD: dbRootPassword,
          MYSQL_DATABASE: dbName,
          MYSQL_USER: dbUser,
          MYSQL_PASSWORD: dbPassword,
        },
        volumes: [`${sanitizedStackName}_db_data:/var/lib/mysql`],
        networks: ['internal'],
        deploy: {
          placement: {
            constraints: ['node.role == worker'],
          },
          restart_policy: {
            condition: 'on-failure',
            delay: '5s',
            max_attempts: 3,
          },
        },
      },
      mautic: {
        image: `mautic/mautic:${mauticVersion}-apache`,
        depends_on: ['db'],
        environment: {
          MAUTIC_DB_HOST: 'db',
          MAUTIC_DB_NAME: dbName,
          MAUTIC_DB_USER: dbUser,
          MAUTIC_DB_PASSWORD: dbPassword,
          MAUTIC_RUN_CRON_JOBS: 'true',
          MAUTIC_TRUSTED_PROXIES: '0.0.0.0/0',
          MAUTIC_URL: `https://${domain}`,
        },
        volumes: [`${sanitizedStackName}_mautic_data:/var/www/html`],
        networks: ['internal', traefikNetwork],
        deploy: {
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': traefikNetwork,
            [`traefik.http.routers.${sanitizedStackName}.rule`]: `Host(\`${domain}\`)`,
            [`traefik.http.routers.${sanitizedStackName}.entrypoints`]: 'websecure',
            [`traefik.http.routers.${sanitizedStackName}.tls`]: 'true',
            [`traefik.http.routers.${sanitizedStackName}.tls.certresolver`]: certResolver,
            [`traefik.http.services.${sanitizedStackName}.loadbalancer.server.port`]: '80',
          },
          placement: {
            constraints: ['node.role == worker'],
          },
          restart_policy: {
            condition: 'on-failure',
            delay: '5s',
            max_attempts: 3,
          },
        },
      },
    },
    networks: {
      internal: {
        driver: 'overlay',
      },
      [traefikNetwork]: {
        external: true,
      },
    },
    volumes: {
      [`${sanitizedStackName}_db_data`]: {},
      [`${sanitizedStackName}_mautic_data`]: {},
    },
  };

  const yamlString = yaml.dump(composeObject, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });

  return yamlString;
}

export function getDefaultMauticVersion(): string {
  return '5.2.4';
}

export function getAvailableMauticVersions(): string[] {
  return ['5.2.4', '5.2.3', '5.2.2', '5.2.1', '5.2.0', '5.1.1', '5.1.0'];
}

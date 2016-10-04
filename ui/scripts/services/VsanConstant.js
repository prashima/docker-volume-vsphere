/**
 * Created by victorlu on 3/30/16.
 */
define([], function () {
   "use strict";

   return {
      //TODO: split the constant to another js file?
      MOR_TYPE_DATASTORE: 'Datastore',
      MOR_TYPE_COMPUTE_RESOURCE : 'ComputeResource',
      MOR_TYPE_VCSA_DEPLOY_SYSTEM: 'VsanVcsaDeployerSystem',
      MOR_VAL_VCSA_DEPLOY_SYSTEM: 'vsan-vcsa-deployer-system',
      MOR_TYPE_NETWORK: 'Network',
      TYPE_VSAN_DATASTORE: 'vsan',
      OVA_UPLOAD_DIR: 'ova5',
      SINGLE_NODE_VSAN_POLICY_STRING: '(("hostFailuresToTolerate" i0))',
      DISK_STATE_ELIGIBLE: 'eligible',
      ENUM_DISK_CLAIM_TYPE: {
         DO_NOT_CLAIM: 'do_not_claim',
         CACHE_TIER: 'cache_tier',
         CAPACITY_TIRE: 'capacity_tire'
      },
      ENUM_NETWORK_MODE: {
         DHCP: 'dhcp',
         STATIC: 'static'
      },
      ENUM_DISKMAPPING_TYPE: {
         ALL_FLASH: 'allflash',
         HYBRID: 'hybrid'
      },
      INTERVAL_QUERY_TASK: 5000,
      MAX_CLUSTER_NAME_LENGTH: 80,
      LICENSE_REGEX: /^([A-Za-z0-9]{5}-?){4}[A-Za-z0-9]{5}$/,
      OVA_REGEX: /\.ova$/i,
      PASSWORD_REGEX: /(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*\d+)(?=.*\W+).{8,20}/,
      DEFAULT_DOMAIN_NAME: 'vsphere.local',
      DEFAULT_SITE_NAME: 'Default-First_Site',

      VCSA_DEPLOY_WIZARD_NAME: 'vcsa.deploy.wizard.name',
   };
});

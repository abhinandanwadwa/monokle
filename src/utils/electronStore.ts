import {PREDEFINED_K8S_VERSION} from '@constants/constants';

const ElectronStore = require('electron-store');

const schema = {
  main: {
    type: 'object',
    properties: {
      resourceRefsProcessingOptions: {
        type: 'object',
        properties: {
          shouldIgnoreOptionalUnsatisfiedRefs: {
            type: 'boolean',
          },
        },
      },
      deviceID: {
        type: 'string',
      },
    },
  },
  appConfig: {
    type: 'object',
    properties: {
      startupModalVisible: {
        type: 'boolean',
      },
      isClusterSelectorVisible: {
        type: 'boolean',
      },
      loadLastProjectOnStartup: {
        type: 'boolean',
      },
      scanExcludes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      fileIncludes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      settings: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
          },
          textSize: {
            type: 'string',
          },
          language: {
            type: 'string',
          },
          helmPreviewMode: {
            type: 'string',
          },
          kustomizeCommand: {
            type: 'string',
          },
          hideExcludedFilesInFileExplorer: {
            type: 'boolean',
          },
          enableHelmWithKustomize: {
            type: 'boolean',
          },
          createDefaultObjects: {
            type: 'boolean',
          },
          setDefaultPrimitiveValues: {
            type: 'boolean',
          },
        },
      },
      recentFolders: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      newVersion: {
        type: 'number',
      },
      k8sVersion: {
        type: 'string',
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            rootFolder: {
              type: 'string',
            },
            k8sVersion: {
              type: 'string',
            },
            lastOpened: {
              type: 'string',
            },
          },
        },
      },
      projectsRootFolder: {
        type: 'string',
      },
      favoriteTemplates: {
        type: 'array',
      },
      disableEventTracking: {
        type: 'boolean',
      },
      disableErrorReporting: {
        type: 'boolean',
      },
    },
  },
  ui: {
    type: 'object',
    properties: {
      isSettingsOpen: {
        type: 'boolean',
      },
      isNotificationsOpen: {
        type: 'boolean',
      },
      isNewResourceWizardOpen: {
        type: 'boolean',
      },
      isFolderLoading: {
        type: 'boolean',
      },
      leftMenu: {
        type: 'object',
        properties: {
          selection: {
            type: 'string',
          },
          isActive: {
            type: 'boolean',
          },
        },
      },
      rightMenu: {
        type: 'object',
        properties: {
          selection: {
            type: 'string',
          },
          isActive: {
            type: 'boolean',
          },
        },
      },
      paneConfiguration: {
        type: 'object',
        properties: {
          leftWidth: {
            type: 'number',
          },
          navWidth: {
            type: 'number',
          },
          editWidth: {
            type: 'number',
          },
          rightWidth: {
            type: 'number',
          },
        },
      },
    },
  },
  uiCoach: {
    type: 'object',
    properties: {
      hasUserPerformedClickOnClusterIcon: {
        type: 'boolean',
      },
    },
  },
  kubeConfig: {
    type: 'object',
    properties: {
      namespaces: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespaceName: {
              type: 'string',
            },
            clusterName: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};

const defaults = {
  appConfig: {
    startupModalVisible: true,
    isClusterSelectorVisible: true,
    loadLastProjectOnStartup: false,
    scanExcludes: ['node_modules', '**/.git', '**/pkg/mod/**', '**/.kube', '**/*.swp', '.monokle'],
    fileIncludes: ['*.yaml', '*.yml'],
    settings: {
      theme: 'dark',
      textSize: 'medium',
      language: 'en',
      helmPreviewMode: 'template',
      createDefaultObjects: false,
      setDefaultPrimitiveValues: true,
    },
    recentFolders: [],
    newVersion: 0,
    k8sVersion: PREDEFINED_K8S_VERSION,
    hasDeletedDefaultTemplatesPlugin: false,
  },
  ui: {
    isSettingsOpen: false,
    isNewResourceWizardOpen: false,
    leftMenu: {
      selection: 'file-explorer',
      isActive: true,
    },
    rightMenu: {
      selection: '',
      isActive: false,
    },
    paneConfiguration: {
      leftWidth: 0.3333,
      navWidth: 0.3333,
      editWidth: 0.3333,
      rightWidth: 0,
    },
  },
  kubeConfig: {
    namespaces: [],
  },
};

const electronStore = new ElectronStore({
  schema,
  defaults,
});

export default electronStore;

import {shell} from 'electron';

import React, {useCallback, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';

import {Modal} from 'antd';

import {ExclamationCircleOutlined, EyeOutlined} from '@ant-design/icons';

import path from 'path';

import {useAppSelector} from '@redux/hooks';
import {isInClusterModeSelector, isInPreviewModeSelectorNew, selectedFilePathSelector} from '@redux/selectors';
import {useResourceMetaMapRef} from '@redux/selectors/resourceMapSelectors';
import {getHelmValuesFile, isHelmChartFile, isHelmTemplateFile, isHelmValuesFile} from '@redux/services/helm';
import {isKustomizationFile} from '@redux/services/kustomize';

import {ContextMenu, Dots, Spinner} from '@atoms';

// import {deleteEntity} from '@utils/files';
import {ROOT_FILE_ENTRY} from '@shared/constants/fileEntry';
import {TreeItemProps} from '@shared/models/explorer';
import {Colors} from '@shared/styles/colors';
import {showItemInFolder} from '@shared/utils/shell';

import * as S from './TreeItem.styled';

function deleteEntityWizard(entityInfo: {entityAbsolutePath: string}, onOk: () => void, onCancel: () => void) {
  const title = `Are you sure you want to delete "${path.basename(entityInfo.entityAbsolutePath)}"?`;

  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    onOk() {
      onOk();
    },
    onCancel() {
      onCancel();
    },
  });
}

const TreeItem: React.FC<TreeItemProps> = props => {
  const {
    isTextExtension,
    isExcluded,
    isFolder,
    isSupported,
    processingEntity,
    title,
    treeKey,
    parentKey: isMatchItem,
  } = props;
  const {
    onDuplicate,
    onRename,
    onExcludeFromProcessing,
    onIncludeToProcessing,
    onCreateFileFolder,
    onCreateResource,
    onFilterByFileOrFolder,
    onPreview,
  } = props;

  const [isTitleHovered, setTitleHoverState] = useState(false);

  const fileOrFolderContainedInFilter = useAppSelector(state => state.main.resourceFilter.fileOrFolderContainedIn);
  const fileMap = useAppSelector(state => state.main.fileMap);
  const osPlatform = useAppSelector(state => state.config.osPlatform);
  const selectedPath = useAppSelector(selectedFilePathSelector);
  const localResourceMetaMapRef = useResourceMetaMapRef('local');
  const helmValuesMap = useAppSelector(state => state.main.helmValuesMap);
  const git = useAppSelector(state => state.git);

  const isInPreviewMode = useSelector(isInPreviewModeSelectorNew);
  const isInClusterMode = useSelector(isInClusterModeSelector);
  const isFileSelected = useMemo(() => treeKey === selectedPath, [treeKey, selectedPath]);
  const isRoot = useMemo(() => treeKey === ROOT_FILE_ENTRY, [treeKey]);
  const platformFileManagerName = useMemo(() => (osPlatform === 'darwin' ? 'Finder' : 'Explorer'), [osPlatform]);
  const root = useMemo(() => fileMap[ROOT_FILE_ENTRY], [fileMap]);
  const target = useMemo(() => (isRoot ? ROOT_FILE_ENTRY : treeKey.replace(path.sep, '')), [isRoot, treeKey]);

  const getBasename = osPlatform === 'win32' ? path.win32.basename : path.basename;
  const getDirname = osPlatform === 'win32' ? path.win32.dirname : path.dirname;

  const relativePath = isRoot ? getBasename(path.normalize(treeKey)) : treeKey;
  const absolutePath = isRoot ? root.filePath : path.join(root.filePath, treeKey);

  const isDisabled = useMemo(
    () =>
      (!isFolder && !isSupported && !isTextExtension) ||
      !fileMap[relativePath]?.filePath.startsWith(fileOrFolderContainedInFilter || ''),
    [fileMap, fileOrFolderContainedInFilter, isFolder, isSupported, isTextExtension, relativePath]
  );

  // useHotkeys(
  //   defineHotkey(hotkeys.DELETE_RESOURCE.key),
  //   () => {
  //     if (treeKey === selectedPath) {
  //       deleteEntityWizard(
  //         {entityAbsolutePath: absolutePath},
  //         () => {
  //           setProcessingEntity({processingEntityID: selectedPath, processingType: 'delete'});
  //           deleteEntity(absolutePath, onDelete);
  //         },
  //         () => {}
  //       );
  //     }
  //   },
  //   [selectedPath]
  // );

  const canPreview = useCallback(
    (entryPath: string): boolean => {
      const fileEntry = fileMap[entryPath];
      return (
        fileEntry &&
        (isKustomizationFile(fileEntry, localResourceMetaMapRef.current) ||
          getHelmValuesFile(fileEntry, helmValuesMap) !== undefined)
      );
    },
    [fileMap, localResourceMetaMapRef, helmValuesMap]
  );

  const handleOnMouseEnter = () => setTitleHoverState(true);
  const handleOnMouseLeave = () => setTitleHoverState(false);
  const handlePreview = (e: any) => {
    e.stopPropagation();
    canPreview(relativePath) && onPreview(relativePath);
  };

  const menuItems = [
    ...(canPreview(relativePath)
      ? [
          {
            key: 'preview',
            label: 'Preview',
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              onPreview(relativePath);
            },
          },
          {key: 'divider-preview', type: 'divider'},
        ]
      : []),
    ...(isFolder
      ? [
          {
            key: 'create_directory',
            label: 'New Folder',
            disabled: isInPreviewMode || isInClusterMode,
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              onCreateFileFolder(absolutePath, 'folder');
            },
          },
          {
            key: 'create_file',
            label: 'New File',
            disabled: isInPreviewMode || isInClusterMode,
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              onCreateFileFolder(absolutePath, 'file');
            },
          },
        ]
      : []),
    {
      key: 'create_resource',
      label: isFolder ? 'New Resource' : 'Add Resource',
      disabled:
        isInPreviewMode ||
        isInClusterMode ||
        isKustomizationFile(fileMap[relativePath], localResourceMetaMapRef.current) ||
        isHelmChartFile(relativePath) ||
        isHelmValuesFile(relativePath) ||
        isHelmTemplateFile(relativePath) ||
        (!isFolder && (isExcluded || !isSupported)),
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        onCreateResource(isFolder ? {targetFolder: target} : {targetFile: target});
      },
    },
    {key: 'divider-1', type: 'divider'},
    {
      key: `filter_on_this_${isFolder ? 'folder' : 'file'}`,
      label:
        fileOrFolderContainedInFilter && relativePath === fileOrFolderContainedInFilter
          ? 'Remove from filter'
          : `Filter on this ${isFolder ? 'folder' : 'file'}`,
      disabled:
        isInPreviewMode ||
        isInClusterMode ||
        isHelmChartFile(relativePath) ||
        isHelmValuesFile(relativePath) ||
        isHelmTemplateFile(relativePath) ||
        isKustomizationFile(fileMap[relativePath], localResourceMetaMapRef.current) ||
        (!isFolder && (isExcluded || !isSupported)),
      onClick: (e: any) => {
        e.domEvent.stopPropagation();

        if (isRoot || (fileOrFolderContainedInFilter && relativePath === fileOrFolderContainedInFilter)) {
          onFilterByFileOrFolder(undefined);
        } else {
          onFilterByFileOrFolder(relativePath);
        }
      },
    },
    ...(fileMap[ROOT_FILE_ENTRY].filePath !== treeKey && onIncludeToProcessing && onExcludeFromProcessing
      ? [
          {
            key: 'add_to_files_exclude',
            label: `${isExcluded ? 'Remove from' : 'Add to'} Files: Exclude`,
            disabled:
              isInPreviewMode ||
              isInClusterMode ||
              isHelmChartFile(relativePath) ||
              isHelmValuesFile(relativePath) ||
              isHelmTemplateFile(relativePath) ||
              (!isFolder && !isSupported && !isExcluded),
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              if (isExcluded) {
                onIncludeToProcessing(relativePath);
              } else {
                onExcludeFromProcessing(relativePath);
              }
            },
          },
        ]
      : []),
    {key: 'divider-2', type: 'divider'},
    {
      key: 'copy_full_path',
      label: 'Copy Path',
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        navigator.clipboard.writeText(absolutePath);
      },
    },
    {
      key: 'copy_relative_path',
      label: 'Copy Relative Path',
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        navigator.clipboard.writeText(relativePath);
      },
    },
    ...(fileMap[ROOT_FILE_ENTRY].filePath !== treeKey
      ? [
          {key: 'divider-3', type: 'divider'},
          {
            key: 'duplicate_entity',
            label: 'Duplicate',
            disabled: isInPreviewMode || isInClusterMode,
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              onDuplicate(absolutePath, getBasename(absolutePath), getDirname(absolutePath));
            },
          },
          {
            key: 'rename_entity',
            label: 'Rename',
            disabled: isInPreviewMode || isInClusterMode,
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              onRename(absolutePath, osPlatform);
            },
          },
          // {
          //   key: 'delete_entity',
          //   label: 'Delete',
          //   disabled: isInPreviewMode || isInClusterMode,
          //   onClick: (e: any) => {
          //     e.domEvent.stopPropagation();
          //     deleteEntityWizard(
          //       {entityAbsolutePath: absolutePath},
          //       () => {
          //         setProcessingEntity({processingEntityID: treeKey, processingType: 'delete'});
          //         deleteEntity(absolutePath, onDelete);
          //       },
          //       () => {}
          //     );
          //   },
          // },
        ]
      : []),
    {key: 'divider-4', type: 'divider'},
    ...(git.repo?.remoteUrl?.includes('https://github.com')
      ? [
          {
            key: 'open_in_github',
            label: 'Open on GitHub',
            onClick: async (e: any) => {
              e.domEvent.stopPropagation();
              shell.openExternal(`${git.repo?.remoteUrl}/tree/${git.repo?.currentBranch}${relativePath}`);
            },
          },
        ]
      : []),
    {
      key: 'reveal_in_finder',
      label: `Reveal in ${platformFileManagerName}`,
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        showItemInFolder(absolutePath);
      },
    },
  ];

  return (
    <ContextMenu disabled={isDisabled} items={menuItems} triggerOnRightClick>
      <S.TreeTitleWrapper $isDisabled={isDisabled} onMouseEnter={handleOnMouseEnter} onMouseLeave={handleOnMouseLeave}>
        <S.TitleWrapper>
          <S.TreeTitleText>{title as React.ReactNode}</S.TreeTitleText>

          {canPreview(relativePath) && (
            <EyeOutlined style={{color: isFileSelected ? Colors.blackPure : Colors.grey7}} />
          )}
        </S.TitleWrapper>

        {processingEntity.processingEntityID === treeKey && processingEntity.processingType === 'delete' && (
          <S.SpinnerWrapper>
            <Spinner />
          </S.SpinnerWrapper>
        )}
        {isTitleHovered && !processingEntity.processingType ? (
          <S.ActionsWrapper>
            {canPreview(relativePath) && !isDisabled && (
              <S.PreviewButton
                type="text"
                size="small"
                disabled={
                  isInPreviewMode ||
                  isInClusterMode ||
                  !fileMap[relativePath].filePath.startsWith(fileOrFolderContainedInFilter || '')
                }
                $isItemSelected={isFileSelected}
                onClick={handlePreview}
              >
                Preview
              </S.PreviewButton>
            )}

            {!isDisabled && (
              <ContextMenu items={menuItems}>
                <div
                  onClick={e => {
                    e.stopPropagation();
                  }}
                >
                  {!isMatchItem && <Dots color={isFileSelected ? Colors.blackPure : undefined} />}
                </div>
              </ContextMenu>
            )}
          </S.ActionsWrapper>
        ) : null}
      </S.TreeTitleWrapper>
    </ContextMenu>
  );
};

export default TreeItem;
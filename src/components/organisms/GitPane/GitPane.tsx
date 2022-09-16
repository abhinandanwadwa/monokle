import React, {useEffect, useState} from 'react';

import {Checkbox, Dropdown} from 'antd';
import {CheckboxChangeEvent} from 'antd/lib/checkbox';

import {DownOutlined} from '@ant-design/icons';

import {GitChangedFile} from '@models/git';

import {useAppSelector} from '@redux/hooks';

import {TitleBar} from '@molecules';

import {promiseFromIpcRenderer} from '@utils/promises';

import DropdownMenu from './DropdownMenu';
import FileList from './FileList';
import * as S from './GitPane.styled';

const GitPane: React.FC<{height: number}> = ({height}) => {
  const changedFiles = useAppSelector(state => state.git.changedFiles);
  const selectedProjectRootFolder = useAppSelector(state => state.config.selectedProjectRootFolder);

  const [loading, setLoading] = useState(false);
  const [selectedStagedFiles, setSelectedStagedFiles] = useState<GitChangedFile[]>([]);
  const [selectedUnstagedFiles, setSelectedUnstagedFiles] = useState<GitChangedFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<GitChangedFile[]>([]);
  const [unstagedFiles, setUnstagedFiles] = useState<GitChangedFile[]>([]);

  const handleSelect = (event: CheckboxChangeEvent, item: GitChangedFile) => {
    if (event.target.checked) {
      if (item.status === 'staged') {
        setSelectedStagedFiles([...selectedStagedFiles, item]);
      } else {
        setSelectedUnstagedFiles([...selectedUnstagedFiles, item]);
      }
    } else if (item.status === 'staged') {
      setSelectedStagedFiles(selectedStagedFiles.filter(file => file.name !== item.name));
    } else {
      setSelectedUnstagedFiles(selectedUnstagedFiles.filter(file => file.name !== item.name));
    }
  };

  const handleSelectAll = () => {
    if (selectedStagedFiles.length + selectedUnstagedFiles.length === changedFiles.length) {
      setSelectedStagedFiles([]);
      setSelectedUnstagedFiles([]);
    } else {
      setSelectedStagedFiles(stagedFiles);
      setSelectedUnstagedFiles(unstagedFiles);
    }
  };

  const handleSelectStagedFiles = () => {
    if (selectedStagedFiles.length === stagedFiles.length) {
      setSelectedStagedFiles([]);
    } else {
      setSelectedStagedFiles(stagedFiles);
    }
  };

  const handleSelectUnstagedFiles = () => {
    if (selectedUnstagedFiles.length === unstagedFiles.length) {
      setSelectedUnstagedFiles([]);
    } else {
      setSelectedUnstagedFiles(unstagedFiles);
    }
  };

  const handleStageSelectedFiles = async () => {
    setLoading(true);

    await promiseFromIpcRenderer('git.stageChangedFiles', 'git.stageChangedFiles.result', {
      localPath: selectedProjectRootFolder,
      filePaths: selectedUnstagedFiles.map(item => item.path),
    });

    setSelectedUnstagedFiles([]);
    setLoading(false);
  };

  const handleUnstageSelectedFiles = async () => {
    setLoading(true);

    await promiseFromIpcRenderer('git.unstageFiles', 'git.unstageFiles.result', {
      localPath: selectedProjectRootFolder,
      filePaths: selectedStagedFiles.map(item => item.path),
    });

    setSelectedStagedFiles([]);
    setLoading(false);
  };

  useEffect(() => {
    if (!changedFiles?.length) {
      return;
    }

    setStagedFiles(changedFiles.filter(file => file.status === 'staged'));
    setUnstagedFiles(changedFiles.filter(file => file.status === 'unstaged'));
  }, [changedFiles]);

  if (!changedFiles.length) {
    return <S.NoChangedFilesLabel>There were no changed files found.</S.NoChangedFilesLabel>;
  }

  return (
    <S.GitPaneContainer id="GitPane" $height={height}>
      <TitleBar title="Commit" closable />

      <S.FileContainer>
        <S.CheckboxWrapper>
          <Checkbox
            onChange={handleSelectAll}
            checked={selectedStagedFiles.length + selectedUnstagedFiles.length === changedFiles.length}
          >
            <S.ChangeList>
              Changelist <S.ChangeListStatus>{changedFiles.length} files</S.ChangeListStatus>
            </S.ChangeList>
          </Checkbox>
        </S.CheckboxWrapper>

        {stagedFiles.length ? (
          <>
            <S.CheckboxWrapper>
              <Checkbox onChange={handleSelectStagedFiles} checked={selectedStagedFiles.length === stagedFiles.length}>
                <S.StagedUnstagedLabel>STAGED</S.StagedUnstagedLabel>
              </Checkbox>
            </S.CheckboxWrapper>
            <FileList
              files={stagedFiles}
              selectedFiles={selectedStagedFiles}
              handleSelect={(e, item) => handleSelect(e, item)}
            />
            {selectedStagedFiles.length ? (
              <S.StagedFilesActionsButton type="primary" onClick={handleUnstageSelectedFiles}>
                Unstage Selected
                <Dropdown overlay={<DropdownMenu items={selectedStagedFiles} />} trigger={['click']}>
                  <DownOutlined
                    onClick={e => {
                      e.stopPropagation();
                    }}
                  />
                </Dropdown>
              </S.StagedFilesActionsButton>
            ) : null}
            <br />
          </>
        ) : null}

        {unstagedFiles.length ? (
          <>
            <S.CheckboxWrapper>
              <Checkbox
                onChange={handleSelectUnstagedFiles}
                checked={selectedUnstagedFiles.length === unstagedFiles.length}
              >
                <S.StagedUnstagedLabel>UNSTAGED</S.StagedUnstagedLabel>
              </Checkbox>
            </S.CheckboxWrapper>
            <FileList
              files={unstagedFiles}
              selectedFiles={selectedUnstagedFiles}
              handleSelect={(e, item) => handleSelect(e, item)}
            />
            {selectedUnstagedFiles.length ? (
              <S.StageSelectedButton loading={loading} type="primary" onClick={handleStageSelectedFiles}>
                Stage selected
              </S.StageSelectedButton>
            ) : null}
          </>
        ) : null}
      </S.FileContainer>
    </S.GitPaneContainer>
  );
};

export default GitPane;

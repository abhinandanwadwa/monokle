import {Button, Col, Input, Row, Select, Tooltip} from 'antd';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {useDebounce} from 'react-use';
import styled from 'styled-components';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {setCurrentContext, updateKubeconfig} from '@redux/reducers/appConfig';
import {closeFolderExplorer} from '@redux/reducers/ui';
import {isInClusterModeSelector, isInPreviewModeSelector} from '@redux/selectors';
import {restartPreview, startPreview, stopPreview} from '@redux/services/preview';
import {loadContexts} from '@redux/thunks/loadKubeConfig';

import {MonoPaneTitle, MonoPaneTitleCol, PaneContainer} from '@atoms';

import {TOOLTIP_DELAY} from '@constants/constants';
import {BrowseKubeconfigTooltip, ClusterModeTooltip} from '@constants/tooltips';

import {BackgroundColors} from '@styles/Colors';

const StyledDiv = styled.div`
  margin-bottom: 20px;
  margin-top: 10px;

  .ant-input {
    margin-bottom: 15px;
  }
`;

const StyledHeading = styled.h2`
  font-size: 16px;
  margin-bottom: 7px;
`;

const StyledButton = styled(Button)``;

const StyledSelect = styled(Select)`
  width: 100%;
`;

const HiddenInput = styled.input`
  display: none;
`;

const TitleRow = styled(Row)`
  width: 100%;
  margin: 0;
  padding: 0;
  background: ${BackgroundColors.darkThemeBackground};
`;

const ClustersContainer = styled.div`
  margin: 16px;
`;

const ClustersPane = () => {
  const dispatch = useAppDispatch();

  const previewResource = useAppSelector(state => state.main.previewResourceId);
  const isInPreviewMode = useSelector(isInPreviewModeSelector);
  const isInClusterMode = useSelector(isInClusterModeSelector);
  const previewLoader = useAppSelector(state => state.main.previewLoader);
  const previewType = useAppSelector(state => state.main.previewType);
  const kubeconfig = useAppSelector(state => state.config.kubeconfigPath);
  const kubeConfig = useAppSelector(state => state.config.kubeConfig);
  const uiState = useAppSelector(state => state.ui);

  const [currentKubeConfig, setCurrentKubeConfig] = useState<string>('');
  const fileInput = useRef<HTMLInputElement>(null);

  const isEditingDisabled = uiState.isClusterDiffVisible;

  useEffect(() => {
    setCurrentKubeConfig(kubeconfig);
  }, [kubeconfig]);

  useDebounce(
    () => {
      if (currentKubeConfig !== kubeconfig) {
        dispatch(updateKubeconfig(currentKubeConfig));
      }
    },
    1000,
    [currentKubeConfig]
  );

  const openFileSelect = () => {
    if (isEditingDisabled) {
      return;
    }
    fileInput && fileInput.current?.click();
  };

  const onSelectFile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isEditingDisabled) {
      return;
    }
    if (fileInput.current?.files && fileInput.current.files.length > 0) {
      const file: any = fileInput.current.files[0];
      if (file.path) {
        const path = file.path;
        dispatch(updateKubeconfig(path));
      }
    }
  };

  const onUpdateKubeconfig = (e: any) => {
    if (isEditingDisabled) {
      return;
    }
    let value = e.target.value;
    setCurrentKubeConfig(value);
  };

  const connectToCluster = () => {
    if (isInPreviewMode && previewResource !== kubeconfig) {
      stopPreview(dispatch);
    }
    startPreview(kubeconfig, 'cluster', dispatch);
  };

  const reconnectToCluster = () => {
    if (isInPreviewMode && previewResource !== kubeconfig) {
      stopPreview(dispatch);
    }
    restartPreview(kubeconfig, 'cluster', dispatch);
  };

  const handleContextChange = (context: any) => {
    if (isEditingDisabled) {
      return;
    }
    dispatch(setCurrentContext(context));
  };

  const createClusterObjectsLabel = useCallback(() => {
    if (isInClusterMode) {
      return <span>Reload Cluster Objects</span>;
    }
    if (previewType === 'cluster' && previewLoader.isLoading) {
      return <span>Loading Cluster Objects</span>;
    }
    return <span>Show Cluster Objects</span>;
  }, [previewType, previewLoader, isInClusterMode]);

  useEffect(() => {
    if (uiState.leftMenu.selection === 'cluster-explorer' && uiState.folderExplorer.isOpen) {
      openFileSelect();
      dispatch(closeFolderExplorer());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState]);

  useEffect(() => {
    if (kubeconfig) {
      dispatch(loadContexts(kubeconfig));
    }
  }, [kubeconfig]);

  return (
    <>
      <TitleRow>
        <MonoPaneTitleCol span={24}>
          <Row>
            <Col span={12}>
              <MonoPaneTitle>Clusters</MonoPaneTitle>
            </Col>
          </Row>
        </MonoPaneTitleCol>
      </TitleRow>
      <PaneContainer>
        <ClustersContainer>
          <StyledDiv>
            <StyledHeading>KUBECONFIG</StyledHeading>
            <Input value={currentKubeConfig} onChange={onUpdateKubeconfig} disabled={isEditingDisabled} />
            <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={BrowseKubeconfigTooltip} placement="right">
              <StyledButton ghost type="primary" onClick={openFileSelect} disabled={isEditingDisabled}>
                Browse
              </StyledButton>
            </Tooltip>
          </StyledDiv>
          <StyledDiv>
            <HiddenInput type="file" onChange={onSelectFile} ref={fileInput} />
            <StyledHeading>Select to retrieve resources from configured kubeconfig</StyledHeading>
            <StyledSelect
              placeholder="Select a context"
              disabled={(previewType === 'cluster' && previewLoader.isLoading) || isEditingDisabled}
              value={kubeConfig.currentContext}
              options={kubeConfig.contexts.map(context => ({label: context.name, value: context.cluster}))}
              onChange={handleContextChange}
            />
          </StyledDiv>
          <StyledDiv>
            <StyledHeading>Select to retrieve resources from selected context</StyledHeading>
            <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterModeTooltip} placement="right">
              <StyledButton
                type="primary"
                ghost
                loading={previewType === 'cluster' && previewLoader.isLoading}
                onClick={isInClusterMode ? reconnectToCluster : connectToCluster}
                disabled={isEditingDisabled}
              >
                {createClusterObjectsLabel()}
              </StyledButton>
            </Tooltip>
          </StyledDiv>
        </ClustersContainer>
      </PaneContainer>
    </>
  );
};

export default ClustersPane;

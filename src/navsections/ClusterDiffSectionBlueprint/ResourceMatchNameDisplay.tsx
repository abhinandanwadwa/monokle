import React, {useMemo, useState} from 'react';
import {ItemCustomComponentProps} from '@models/navigator';
import {K8sResource} from '@models/k8sresource';
import styled from 'styled-components';
import Colors from '@styles/Colors';
import {SwapOutlined, ArrowLeftOutlined, ArrowRightOutlined, ExclamationCircleOutlined} from '@ant-design/icons';
import {performResourceDiff} from '@redux/thunks/diffResource';
import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {Tooltip, Tag, Modal} from 'antd';
import {TOOLTIP_DELAY} from '@constants/constants';
import {ClusterDiffApplyTooltip, ClusterDiffCompareTooltip, ClusterDiffSaveTooltip} from '@constants/tooltips';
import {applyResourceWithConfirm} from '@redux/services/applyResourceWithConfirm';
import {diffLocalToClusterResources, removeIgnoredPathsFromResourceContent} from '@utils/resources';
import {stringify} from 'yaml';
import {updateResource} from '@redux/reducers/main';

const Container = styled.div<{highlightdiff: boolean; hovered: boolean}>`
  width: 800px;
  display: flex;
  justify-content: space-between;
  margin-left: -24px;
  padding-left: 24px;
  ${props => props.highlightdiff && `background: ${Colors.diffBackground}; color: white !important;`}
  ${props => props.hovered && `background: ${Colors.blackPearl};`}
  ${props => props.highlightdiff && props.hovered && `background: ${Colors.diffBackgroundHover}`}
`;

const Label = styled.span<{disabled?: boolean}>`
  width: 300px;
  ${props => props.disabled && `color: ${Colors.grey800};`}
`;

const IconsContainer = styled.div`
  width: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

function ResourceMatchNameDisplay(props: ItemCustomComponentProps) {
  const {itemInstance} = props;
  const dispatch = useAppDispatch();
  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const fileMap = useAppSelector(state => state.main.fileMap);
  const kubeconfigPath = useAppSelector(state => state.config.kubeconfigPath);
  const resourceFilterNamespace = useAppSelector(state => state.main.resourceFilter.namespace);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const {clusterResource, localResources} = (itemInstance.meta || {}) as {
    clusterResource?: K8sResource;
    localResources?: K8sResource[];
  };
  const firstLocalResource = useMemo(() => {
    return localResources && localResources.length > 0 ? localResources[0] : undefined;
  }, [localResources]);

  const areResourcesDifferent = useMemo(() => {
    if (!firstLocalResource || !clusterResource) {
      return false;
    }
    return diffLocalToClusterResources(firstLocalResource, clusterResource).areDifferent;
  }, [firstLocalResource, clusterResource]);

  const onClickDiff = () => {
    if (!firstLocalResource) {
      return;
    }
    dispatch(performResourceDiff(firstLocalResource.id));
  };

  const onClickApply = () => {
    if (!firstLocalResource) {
      return;
    }
    applyResourceWithConfirm(firstLocalResource, resourceMap, fileMap, dispatch, kubeconfigPath);
  };

  const saveClusterResourceToLocal = () => {
    if (!firstLocalResource || !clusterResource) {
      return;
    }
    const newClusterResoureContent = removeIgnoredPathsFromResourceContent(clusterResource.content);
    const clusterResourceContentText = stringify(newClusterResoureContent, {sortMapEntries: true});

    dispatch(
      updateResource({
        resourceId: firstLocalResource.id,
        content: clusterResourceContentText,
        preventSelectionAndHighlightsUpdate: true,
      })
    );
  };

  const onClickSave = () => {
    if (!firstLocalResource || !clusterResource) {
      return;
    }
    Modal.confirm({
      title: `Replace local ${clusterResource.name} with cluster version?`,
      icon: <ExclamationCircleOutlined />,
      centered: true,
      onOk() {
        return new Promise(resolve => {
          saveClusterResourceToLocal();
          resolve({});
        });
      },
      onCancel() {},
    });
  };
  if (!clusterResource && !localResources) {
    return null;
  }

  return (
    <Container
      hovered={isHovered}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      highlightdiff={areResourcesDifferent}
    >
      <Label disabled={!firstLocalResource}>
        {!resourceFilterNamespace && (
          <Tag color={areResourcesDifferent ? 'orange' : 'blue'}>
            {firstLocalResource?.namespace ? firstLocalResource.namespace : 'default'}
          </Tag>
        )}
        {itemInstance.name}
      </Label>
      <IconsContainer>
        {firstLocalResource && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffApplyTooltip}>
            <ArrowRightOutlined onClick={onClickApply} />
          </Tooltip>
        )}
        {clusterResource && firstLocalResource && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffCompareTooltip}>
            <SwapOutlined onClick={onClickDiff} />
          </Tooltip>
        )}
        {clusterResource && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffSaveTooltip}>
            <ArrowLeftOutlined onClick={onClickSave} />
          </Tooltip>
        )}
      </IconsContainer>

      <Label disabled={!clusterResource}>
        {!resourceFilterNamespace && (
          <Tag color={areResourcesDifferent ? 'orange' : !clusterResource ? 'rgba(58, 67, 68, 0.3)' : 'blue'}>
            <span style={{color: !clusterResource ? '#686868' : undefined}}>
              {clusterResource?.namespace ? clusterResource.namespace : 'default'}
            </span>
          </Tag>
        )}
        {itemInstance.name}
      </Label>
    </Container>
  );
}

export default ResourceMatchNameDisplay;

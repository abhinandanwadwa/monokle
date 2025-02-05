import styled from 'styled-components';

import {useAppSelector} from '@redux/hooks';
import {getActiveResourceMetaMapFromState} from '@redux/selectors/resourceMapGetters';
import {isKustomizationPatch, isKustomizationResource} from '@redux/services/kustomize';

import {isResourcePassingFilter} from '@utils/resources';

import {Colors, FontColors} from '@shared/styles';

type Props = {
  kind: string;
  isSelected: boolean;
  onClick: () => void;
};

function ResourceCounter({kind, isSelected, onClick}: Props) {
  const isCollapsed = useAppSelector(state => state.ui.navigator.collapsedResourceKinds.includes(kind));
  const resourceFilter = useAppSelector(state => state.main.resourceFilter);

  const resourceCount = useAppSelector(
    state =>
      Object.values(getActiveResourceMetaMapFromState(state)).filter(
        r =>
          r.kind === kind &&
          isResourcePassingFilter(r, resourceFilter) &&
          !isKustomizationResource(r) &&
          !isKustomizationPatch(r)
      ).length
  );

  if (resourceCount === undefined) {
    return null;
  }

  return (
    <Counter selected={isSelected && isCollapsed} onClick={onClick}>
      {resourceCount}
    </Counter>
  );
}

export default ResourceCounter;

const Counter = styled.span<{selected: boolean}>`
  margin-left: 8px;
  font-size: 14px;
  cursor: pointer;
  ${props => (props.selected ? `color: ${Colors.blackPure};` : `color: ${FontColors.grey};`)}
`;

import React from 'react';
import styled from 'styled-components';
import {Select, Tooltip} from 'antd';
import {NamespacesFilterTooltip} from '@src/tooltips';

const {Option} = Select;

type NamespacesSectionType = {
  namespace: string;
  namespaces: string[];
  onSelect: (selectedNamespace: string) => void;
};

const StyledDiv = styled.div`
  padding-left: 16px;
  width: 100%;
`;

const SelectContainer = styled.div`
  flex: 1;
`;
const StyledSpan = styled.span`
  flex: 1;
`;

const NamespacesSection = (props: NamespacesSectionType) => {
  const {namespace, namespaces, onSelect} = props;

  return (
    <StyledDiv>
      <StyledSpan>Namespace:</StyledSpan>
      <SelectContainer>
        <Tooltip title={NamespacesFilterTooltip}>
          <Select
            showSearch
            placeholder="Namespace"
            onChange={onSelect}
            size="small"
            style={{width: '100%'}}
            bordered={false}
            value={namespace}
          >
            {namespaces.map(n => {
              return (
                <Option key={n} value={n}>
                  {n}
                </Option>
              );
            })}
          </Select>
        </Tooltip>
      </SelectContainer>
    </StyledDiv>
  );
};

export default NamespacesSection;
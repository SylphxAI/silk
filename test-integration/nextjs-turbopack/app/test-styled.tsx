// 測試 styled-components 在 Turbopack 中的工作情況
import styled from 'styled-components';

const RedText = styled.div`
  color: red;
  font-size: 2rem;
`;

const BlueText = styled.div`
  color: blue;
  font-size: 1.5rem;
`;

export default function TestStyled() {
  return (
    <div>
      <RedText>Red Text (styled-components)</RedText>
      <BlueText>Blue Text (styled-components)</BlueText>
    </div>
  );
}
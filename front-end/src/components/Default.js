import React from 'react'
import Header from './Header'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  // margin-bottom: 30px;
`;

const Default = ({ children }) => {
  return (
    <Wrapper>
      <Header />
      <MainContent>{children}</MainContent>
    </Wrapper>
  )
}

export default Default
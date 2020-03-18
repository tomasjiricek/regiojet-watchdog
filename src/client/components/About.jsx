import React from 'react';

import Content from './Content';

const About = () => (
    <Content style={{ backgroundColor: 'transparent', margin: '0 20px' }}>
        <h3>Tato aplikace není provozovaána společností RegioJet&nbsp;a.s.</h3>
        <p>
            Aplikace slouží pro vyhledávání a hlídání spojů společnosti RegioJet.
            Není určena pro širší veřejnost, proto ji prosím nikde <strong>nesdílejte</strong>.
        </p>
    </Content>
);

export default About;

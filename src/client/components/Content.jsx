import React from 'react';

const DEFAULT_STYLE = {
    margin: '0 20px',
    padding: '20px 0',
    textAlign: 'left',
    fontSize: '1em'
};

const Content = ({ style, children }) => (
    <div style={{ ...DEFAULT_STYLE, ...style }}>{children}</div>
);

export default Content;
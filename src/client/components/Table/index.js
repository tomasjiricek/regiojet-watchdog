import React from 'react';
import { Col as BSCol, Grid, Row as BSRow, Table as BSTable } from 'react-bootstrap';

export const Col = ({ children, heading, ...props }) => (
    <BSCol componentClass={heading ? 'th' : 'td'} {...props}>{children}</BSCol>
);

export const Row = ({ children, ...props}) => (
    <BSRow componentClass="tr" {...props}>{children}</BSRow>
);
    
export const Table = ({ children, ...props }) => (
    <Grid fluid>
        <BSTable {...props}>{children}</BSTable>
    </Grid>
);

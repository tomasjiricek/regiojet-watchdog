import React, { Component, Fragment } from 'react';

import { Glyphicon, Panel } from 'react-bootstrap';

export default class RouteDetails extends Component {
    render() {
        return (
            <Panel><Panel.Body>
                <h4>Detail spojení</h4>
                <table>
                    <tbody>{this.renderTableBody()}</tbody>
                </table>
            </Panel.Body></Panel>
        );
    }

    renderTableBody() {
        const {
            arrivalStation,
            arrivalTime,
            departureStation,
            departureTime,
            freeSeatsCount,
            transfersCount,
            travelTime
        } = this.props.route;
        const arrivalDate = new Date(arrivalTime);
        const departureDate = new Date(departureTime);

        return (
            <Fragment>
                <tr>
                    <th>Směr:</th>
                    <td>
                        {departureStation.fullname}
                        <Glyphicon glyph="arrow-right" style={{ margin: '0 15px' }}/>
                        {arrivalStation.fullname}
                    </td>
                </tr>
                <tr>
                    <th>Odjezd:</th>
                    <td>{departureDate.toLocaleDateString()} v {departureDate.toLocaleTimeString()}</td>
                </tr>
                <tr>
                    <th>Příjezd:</th>
                    <td>{arrivalDate.toLocaleDateString()} v {arrivalDate.toLocaleTimeString()}</td>
                </tr>
                <tr>
                    <th>Volných míst:</th>
                    <td>{freeSeatsCount}</td>
                </tr>
                <tr>
                    <th>Doba jízdy:</th>
                    <td>{travelTime}</td>
                </tr>
                <tr>
                    <th>Počet přestupů:</th>
                    <td>{transfersCount}</td>
                </tr>
            </Fragment>
        );
    }
}
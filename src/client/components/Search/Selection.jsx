import React, { Component } from 'react';
import { Button, Col, Form, FormControl, Glyphicon, Grid, FormGroup, InputGroup, Row } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';

import { getUTCISODate } from '../../utils/date';
import './selection.css';

const FILTER_FIELDS = ['name', 'fullname', 'country', 'city'];

class Selection extends Component {
    handleTypeaheadPropChange = (isDeparture, selected) => {
        this.props.onStationChange(isDeparture, selected[0] || null);
    }

    handleDateChange = (event) => {
        this.props.onDateChange(event.target.value);
    }

    handleSubmit = () => {
        this.props.onSubmit();
    }

    handleSwapStations = () => {
        this.props.onStationsSwap();
    }

    render() {
        const { arrivalStation, date, departureStation, loading } = this.props;
        const disableSubmit = loading || !departureStation || !arrivalStation;
        return (
            <Grid fluid><Form className="search">
                <Row>
                    <Col sm={2}>
                        <FormControl
                            type="text"
                            onChange={this.handleDateChange}
                            value={date}
                            placeholder="Datum"
                        />
                    </Col>
                    <Col sm={8}>
                        <FormGroup>
                            <InputGroup className="search-inputs">
                                {this.renderStationInput('Odkud', true)}
                                {this.renderSwapStationsButton()}
                                {this.renderStationInput('Kam', false)}
                            </InputGroup>
                        </FormGroup>
                    </Col>
                    <Col sm={2}>
                        <Button bsStyle="primary" disabled={disableSubmit} onClick={this.handleSubmit}>Vyhledat</Button>
                    </Col>
                </Row>
            </Form></Grid>
        );
    }

    renderStationInput(placeholder, isDepartureInput) {
        const { departureStation, arrivalStation, stations } = this.props;
        const selectedValue = isDepartureInput ? departureStation : arrivalStation;
        return (
            <Typeahead
                ignoreDiacritics
                id={placeholder}
                labelKey="fullname"
                placeholder={placeholder}
                emptyLabel="Nic nenalezeno"
                minLength={2}
                filterBy={FILTER_FIELDS}
                options={stations}
                onChange={this.handleTypeaheadPropChange.bind(this, isDepartureInput)}
                selectHintOnEnter={true}
                selected={selectedValue ? [selectedValue] : []}
            />
        );
    }

    renderSwapStationsButton() {
        return (
            <InputGroup.Button>
                <Button bsStyle="primary" className="swap-stations" onClick={this.handleSwapStations}>
                    <Glyphicon glyph="transfer"/>
                </Button>
            </InputGroup.Button>
        );
    }
}

export default Selection;

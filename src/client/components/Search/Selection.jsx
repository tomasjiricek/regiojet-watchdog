import React, { Component } from 'react';
import { Button, Col, Form, Glyphicon, Grid, FormGroup, InputGroup, Row } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import DatePicker from 'react-16-bootstrap-date-picker';

import 'react-bootstrap-typeahead/css/Typeahead.min.css';
import './selection.css';

const DATEPICKER_DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const DATEPICKER_MONTH_LABELS = [
    'led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'
];
const FILTER_FIELDS = ['name', 'fullname', 'country', 'city'];

function addMonths(date, months) {
    const day = date.getDate();
    date.setMonth(date.getMonth() + +months);

    if (date.getDate() !== day) {
        date.setDate(0);
    }

    return date;
}

class Selection extends Component {
    handleTypeaheadPropChange = (isDeparture, selected) => {
        this.props.onStationChange(isDeparture, selected[0] || null);
    }

    handleDateChange = (value) => {
        this.props.onDateChange(value);
    }

    handleSubmit = () => {
        this.props.onSubmit();
    }

    handleSwapStations = () => {
        this.props.onStationsSwap();
    }

    render() {
        const { arrivalStation, departureStation, loading } = this.props;
        const disableSubmit = loading || !departureStation || !arrivalStation;
        return (
            <Grid fluid><Form className="search">
                <Row>
                    <Col sm={2}>{this.renderDatePicker()}</Col>
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

    renderDatePicker() {
        const { date } = this.props;

        return (
            <DatePicker
                className="date-picker"
                dateFormat="DD.MM.YYYY"
                dayLabels={DATEPICKER_DAY_LABELS}
                value={date}
                minDate={new Date().toISOString()}
                maxDate={addMonths(new Date(), 4).toISOString()}
                monthLabels={DATEPICKER_MONTH_LABELS}
                nextButtonElement={this.renderDatePickerNextMonthIcon()}
                noInvalid
                onChange={this.handleDateChange}
                previousButtonElement={this.renderDatePickerPreviousMonthIcon()}
                showClearButton={false}
                showTodayButton
                todayButtonLabel="Dnes"
                weekStartsOn={1}
            />
        );
    }

    renderDatePickerNextMonthIcon() {
        return <Glyphicon glyph="triangle-right"/>;
    }

    renderDatePickerPreviousMonthIcon() {
        return <Glyphicon glyph="triangle-left"/>;
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

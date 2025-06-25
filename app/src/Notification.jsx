import React, { Component } from 'react';

class Notification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isVisible: false
        };
    }

    componentDidUpdate(prevProps) {
        // Проверяем, изменилось ли значение isVisible
        if (this.props.isVisible !== prevProps.isVisible) {
            // Если isVisible стало true, устанавливаем состояние isVisible в true и запускаем таймер для его сброса через 2 секунды
            if (this.props.isVisible) {
                this.setState({ isVisible: true }, () => {
                    this.timer = setTimeout(() => {
                        this.setState({ isVisible: false });
                    }, 1000);
                });
            } else {
                // Если isVisible стало false, сбрасываем таймер и устанавливаем isVisible в false
                clearTimeout(this.timer);
                this.setState({ isVisible: false });
            }
        }
    }
    componentWillUnmount() {
        clearTimeout(this.timer);
    }
    render() {
        const { isVisible } = this.state;
        return (
            <div className='Notification'>
                {isVisible &&
                    <div className='NotificationContainer'>
                        <div className='Notification-view'>
                            {this.props.text}
                        </div>
                    </div>}
            </div>
        );
    }
}
export default Notification
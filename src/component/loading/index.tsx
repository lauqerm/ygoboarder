import { Spin } from 'antd';
import './loading.scss';

export type Loading = {
    size?: 'small' | 'large' | 'default'
}

export const Loading = () => {
    return <Spin />;
};

Loading.FullView = ({
    size = 'large',
}: Loading) => {
    return <div className="loading-fullview">
        <Spin size={size} />
    </div>;
};
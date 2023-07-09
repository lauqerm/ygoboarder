import { DraggingStyle, NotDraggingStyle, DraggableStateSnapshot } from 'react-beautiful-dnd';

export const getDraggingClass = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot, index: number): string => {
    /** Indicator để giúp user nhận biết vị trí sẽ drag */
    if (!snapshot.isDragging && (style?.transform ?? '').length > 0) {
        return 'affected-by-dragging';
    }
    if (snapshot.isDragging) return 'is-dragging';
    return '';
};
export const getDraggingStyle = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot): React.CSSProperties | undefined => {
    /** Giảm giật layout */
    if (!snapshot.isDragging) {
        /** Không dùng regex vì quá lười */
        return {
            ...style,
            transform: '',
        };
    }
    /** Skip hết mức transition lúc drop để giảm giật layout */
    if (snapshot.isDropAnimating && snapshot.dropAnimation) {
        const { curve } = snapshot.dropAnimation;

        return {
            ...style,
            visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
            transition: `all ${curve} 0.001s, visibility 0s`,
        };
    }
    return style;
};

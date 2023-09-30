## Backlog

### Small features
* Cảnh báo trong quá trình upload / Thông báo tất cả upload đã xong
* Manual modal (complete)
* Activation indicator
* Remove counter when go face-down
* Cancel / Retry in manager

### Large features
* Hand zone
* Action log
* Note
* Separate name / type (spell monster trap) for import card (to sort)
* Side deck
* Revamp interaction system:
    * Allow point-moving instead of dragging
    * Double click to activate
    * Ctrl-click to change phase
    * Transparent modal while select
* Mass replace card image
* Retire offline image

### Bugs
* Issue khi modal tự tắt không rõ lý do? (khả năng do resize)
* Could not add to board if drag card on to another card
* Card face-down add vào banished zone hay extra deck vẫn face-up

## Drag-n-Drop when scrolling is a mess, should be an edge case though
## Multiple deck modal
Vì sao làm multiple deck modal lại khó đến vậy :'(
* Việc stack modal đã (có vẻ) làm được
* Việc move card từ modal ra ngoài và ngược lại (có vẻ) đã làm được
* Việc move card từ modal này sang modal khác có nhiều vấn đề nghiêm trọng
    * Stack bằng z-index khiến việc move card qua lại giữa 2 modal có rất nhiều bug
    * Một behavior cần có là khi move từ modal A qua modal B mà có overlap, modal A không được phép nhảy cao hơn modal B (nói cách khác thứ tự z index của modal A và B không được thay đổi), tuy nhiên card trong modal A cũng vì vậy mà không bao giờ cao hơn modal B, và do đó sẽ bị modal B che đi, ta chỉ có thể chọn giữa behavior truyền thống và bỏ behavior này in favor of multiple modal

f9bbe0da263580e
3f45f6bb2ac38e4f9568dc8be1f32c5ee98bbce3
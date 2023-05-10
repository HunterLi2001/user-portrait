import { Form, Button, Divider, Select, Space, Input } from "antd";
import { MinusCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { useEffect } from "react";

export default function Composition(props) {
	const { nounsGroups, numsGroups, setSelectedGroups, confirmed, setConfirmed } = props;

	const [form] = Form.useForm();

	const onFinish = (data) => {
		const reqData = data.selectedGroups.map((item) => {
			const mapedData = item.data.map((elem) => {
				if (elem.title == 1) {
					return { ...nounsGroups[elem.value], name: elem.label };
				}
				if (elem.title == 0) {
					return { ...numsGroups[elem.value], name: elem.label };
				}
			});
			return { name: item.groupName || "", data: mapedData };
		});
		setConfirmed(true)
		setSelectedGroups(reqData);
	};

	useEffect(() => {
		const originData = form.getFieldsValue().selectedGroups
		if(!originData) return ;
		if(!nounsGroups.length && !numsGroups.length){
			form.resetFields()
			return ;
		}
		//重置分组组合中的选项
		form.setFieldValue(
			"selectedGroups",
			originData.map((item) => ({ ...item, data: [] }))
		);
	}, [numsGroups, nounsGroups])

	return (
		<Form
			name="groups"
			form={form}
			onFinish={onFinish}
			style={{ minHeight: "115px" }}
		>
			<Divider style={{marginTop:0}} />
			<Form.List name="selectedGroups">
				{(fields, { add, remove }) => (
					<>
						{fields.map(({ key, name, ...restField }, CompositionIdx) => (
							<Space
								key={key}
								style={{
									display: "flex",
								}}
								align="baseline"
							>
								<Form.Item
									{...restField}
									name={[name, "groupName"]}
									label={`组合名称`}
									rules={[
										{
											required: true,
											message: "未输入组合名称",
											
										},
									]}
								>
									<Input style={{ width: 100 }} />
								</Form.Item>
								<Form.Item
									{...restField}
									label={`分组组合${CompositionIdx + 1}`}
									name={[name, "data"]}
								>
									<Select
										mode="multiple"
										labelInValue
										style={{ width: 300 }}
										disabled={confirmed}
										notFoundContent={
											<Space align="center">
												<WarningOutlined />
												未添加分组
											</Space>
										}
										options={[...nounsGroups, ...numsGroups].map(
											(item, index) => {
												return {
													label: item.name,
													value: index,
													title: item.linkType,
												};
											}
										)}
									/>
								</Form.Item>
								<MinusCircleOutlined onClick={() => remove(name)} />
							</Space>
						))}
						{!confirmed && (
							<Space>
								<Button disabled={!nounsGroups.length && !numsGroups.length} onClick={() => add()}>新增组合</Button>
								<Button
									htmlType="submit"
									type="primary"
									disabled={!fields.length}
								>
									确认
								</Button>
							</Space>
						)}
					</>
				)}
			</Form.List>
		</Form>
	);
}

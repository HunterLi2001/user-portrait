import { Modal, Select, Input, message, Space, Tag, Tooltip } from "antd";
import styles from "@/styles/BasicBar.module.scss";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import DataGroup from "./DataGroup";
import Composition from "./Composition";
import IntervalDataGroup from "./IntervalDataGroup";
import { charTypeConfig, charType } from "./constant";

export default function AddChar(props) {
	const { propertyList, defaultOption } = props;
	//console.log(defaultOption);
	// const { name:defaultName, defaultType, defualtProperty, defualtData } =
	//   defaultOption?.viewData;
	const [selectCharType, setSelectCharType] = useState(); // 选择的图表类型
	const [selectLinkType, setSelectLinkType] = useState(); // 选中的属性类型 是名词还是区间 0/1
	const [numberScope, setNumberScope] = useState({}); //数值型属性可选范围
	const [curScope, setCurScope] = useState({});
	const [selectProperty, setSelectProperty] = useState(); // 选中的单个属性
	const [numsGroups, setNumsGroups] = useState([]);
	const [nounsGroups, setNounsGroups] = useState([]);
	const [name, setName] = useState();
	const [selectedGroups, setSelectedGroups] = useState([]);
	const [charData, setCharData] = useState([]);

	const linkType = {
		singleLink: 1,
		intervalLink: 0,
	};

	const handleModalOkClick = () => {
		//信息是否完善
		if (name && selectCharType && selectProperty) {
			if (nounsGroups.length || numsGroups.length) {
				//复合型
				let data = selectedGroups.map(async (item) => {
					const NAME = item.name;
					const numDTOList = item.data.filter((elem) => elem.linkType === 0);
					const nounsDTOList = item.data.filter((elem) => elem.linkType === 1);
					const reqData = { numDTOList, nounsDTOList };
					const response = await api.getNounsAndNumerical(reqData);
					return { name: NAME, value: response.data.data };
				});
				Promise.all(data).then((res) => {
					addCharOption({
						name,
						type: selectCharType,
						property: [selectProperty],
						data: res,
					});
				});
				props.setIsModalOpen(false);
			} else if (!charData.length && selectLinkType === linkType.intervalLink) {
				//数值型
				api
					.getNumerical({
						start: curScope.start,
						end: curScope.end,
						link: selectProperty,
					})
					.then((res) => {
						const data = { name, value: res.data.data };
						addCharOption({
							name,
							type: selectCharType,
							property: [selectProperty],
							data: [data],
						});
					});
				props.setIsModalOpen(false);
			} else if (selectLinkType === linkType.singleLink) {
				//名词型
				addCharOption({
					name,
					type: selectCharType,
					property: [selectProperty],
					data: charData,
				});
				props.setIsModalOpen(false);
			}
		} else {
			//信息不全
			message.info("请完善信息");
		}
	};

	// 根据属性获取数据
	const handleChange = (value, option) => {
		// 1调用getNouns
		const { type } = option;
		setSelectLinkType(type);
		setSelectProperty({
			linkId: option.value,
			linkComment: option.label,
			connectionId: props.connectionId.current,
			linkType: type,
		});
	};

	//选择的属性变化时请求数据
	useEffect(() => {
		if (selectProperty === undefined) return;
		//获取名词属性数据
		if (selectProperty.linkType === linkType.singleLink) {
			api
				.getNouns({
					linkId: selectProperty.linkId,
					linkComment: selectProperty.linkComment,
					connectionId: props.connectionId.current,
					linkType: selectProperty.linkType,
				})
				.then((res) => {
					const data = res.data.data;
					const newData = Object.keys(data).map((key) => ({
						name: key,
						value: data[key],
						linkId: selectProperty.linkId,
					}));
					setCharData(newData);
				});
		}
		//获取数值属性数据
		if (selectProperty.linkType === linkType.intervalLink) {
			api
				.getNumericalScope({
					link: {
						linkId: selectProperty.linkId,
						linkComment: selectProperty.linkComment,
						connectionId: props.connectionId.current,
						linkType: selectProperty.linkType,
					},
				})
				.then((res) => {
					setNumberScope(res.data.data);
					setCurScope({ start: res.data.data.min, end: res.data.data.max });
				});
		}
	}, [selectProperty, selectCharType]);

	const addCharOption = (option) => {
		const pieOption = { ...option, property: [{ linkComment: "自定义" }] };
		const newOption = {
			...option,
			data: option.data.map((item) => ({ name: item.name, value: item.value })),
			property: [{ linkComment: "自定义" }],
		};
		api.insertViewInfo({ viewData: JSON.stringify(newOption) }).then((res) => {
			const viewId = res.data.msg;
			if (selectCharType === charTypeConfig.pie) {
				props.addViewChar(pieOption, viewId);
			} else {
				console.log(option);
				const newData = {
					xAxisData: option.data.map((item) => item.name),
					yAxisData: option.data.map((item) => item.value),
				};
				const data = {
					name,
					type: selectCharType,
					property: [{ linkComment: "自定义" }],
					data: newData,
				};
				console.log(data);
				props.addViewChar(data, viewId);
			}
		});
	};

	useEffect(() => {
		return () => {
			setSelectCharType(null);
			setSelectLinkType(null);
			setNumberScope({});
		};
	}, []);

	return (
		<>
			<Modal
				title="生成图表"
				open={props.isModalOpen}
				destroyOnClose={true}
				onOk={handleModalOkClick}
				onCancel={() => {
					setSelectCharType(null);
					props.setIsModalOpen(false);
				}}
				okText="生成"
				cancelText="取消"
				width={700}
			>
				<div>
					<span>输入图表名称：</span>
					<Input
						placeholder="输入图表名称"
						style={{ width: "300px", marginLeft: "20px" }}
						onChange={(e) => {
							setName(e.target.value);
						}}
						// defaultValue={defaultName}
					/>
				</div>
				<div>
					生成图表类型:
					<Select
						style={{ width: 300, marginLeft: "20px" }}
						onChange={(value) => {
							setSelectCharType(value);
						}}
						options={charType}
					/>
				</div>
				{selectCharType && (
					<>
						<div>
							选择属性：
							<Select
								style={{ width: 200 }}
								onChange={handleChange}
								options={[
									{
										label: "区间性属性",
										key: 0,
										options:
											propertyList[0] &&
											propertyList[0].map((item) => ({
												value: item.linkId,
												label: item.linkComment,
												type: linkType.intervalLink,
											})),
									},
									{
										label: "名词性属性",
										key: 1,
										options:
											propertyList[1] &&
											propertyList[1].map((item) => ({
												label: item.linkComment,
												value: item.linkId,
												type: linkType.singleLink,
											})),
									},
								]}
							/>
						</div>
						<Space size={"small"} wrap>
							当前分组：
							{nounsGroups.length === 0 && numsGroups.length === 0 ? (
								charData.map((item, index) => (
									<span key={index} style={{ marginRight: "10px" }}>
										{item.name}
									</span>
								))
							) : (
								<div>
									{nounsGroups.map((item, index) => (
										<Tooltip key={index} title={nounsGroups[index].value}>
											<Tag
												closable
												onClose={(e) => {
													setNounsGroups((pre) =>
														pre.filter((_, idx) => index !== idx)
													);
													e.preventDefault();
												}}
											>
												{item.name}
											</Tag>
										</Tooltip>
									))}
									{numsGroups.map((item, index) => (
										<Tooltip
											key={index}
											title={`${numsGroups[index].start}-${numsGroups[index].end}`}
										>
											<Tag
												closable
												onClose={(e) => {
													setNumsGroups((pre) =>
														pre.filter((_, idx) => index !== idx)
													);
													e.preventDefault();
												}}
											>
												{item.name}
											</Tag>
										</Tooltip>
									))}
								</div>
							)}
						</Space>
						{selectLinkType === linkType.intervalLink && (
							<IntervalDataGroup
								numberScope={numberScope}
								curScope={curScope}
								setCurScope={setCurScope}
								setNumsGroups={setNumsGroups}
								selectProperty={selectProperty}
							/>
						)}
						{selectLinkType === linkType.singleLink && (
							<DataGroup
								charData={charData}
								numberScope={numberScope}
								selectProperty={selectProperty}
								setNounsGroups={setNounsGroups}
							/>
						)}
						<Composition
							nounsGroups={nounsGroups}
							numsGroups={numsGroups}
							setSelectedGroups={setSelectedGroups}
						/>
					</>
				)}
			</Modal>
		</>
	);
}

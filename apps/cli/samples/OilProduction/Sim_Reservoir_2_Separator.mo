  model Sim_Reservoir_2_Separator
    // Simulation of Oil Production from Reservoir to Separator
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			October 3, 2022
	//
	// Instantiate model of Reservoir_to_Separator system
	//Mod_GenericPipe G;
	Mod_Reservoir_2_Manifold R2M1, R2M2(h_p_sig = 0.8*1210.6);
	Mod_Manifold M;
	Mod_Manifold_2_Separator M2S;
	// Declaring variables
	// -- inputs
	Real u_p_f "Reservoir formation pressure, Pa";
    Real u_p_s "Separator pressure, Pa";
	Real u_f_p "ESP pump rotational frequency, Hz";
	Real u_f_bp "Booster pump rotational frequency, Hz";
	Real u_chi_w1 "Water cut from reservoir 1, -";
	Real u_chi_w2 "Water cut from reservoir 2, -";
	Real u_chi_w_m "Water cut in manifold, -";
	// -- outputs
	output Real y_Vd_v1_d "Vertical pipe flow 1 per day, m3/d";
	output Real y_Vd_v2_d "Vertical pipe flow 2 per day, m3/d";
	output Real y_Vd_t_d "Transport pipe flow, m3/d";
	output Real y_p_h1_bar "Heel 1 pressure, bar";
	output Real y_p_h2_bar "Heel 2 pressure, bar";
	output Real y_dp_f1_bar "Friction pressure drop, vertical pipe 1, bar";
	output Real y_dp_f2_bar "Friction pressure drop, vertical pipe 2, bar";
	output Real y_dp_ft_bar "Friction pressure drop, transport pipe, bar";
	output Real y_p_c_i1_bar "Pressure in front of choke valve 1, bar";
	output Real y_p_c_i2_bar "Pressure in front of choke valve 2, bar";
	output Real y_p_m_bar "Manifold pressure, bar";
	output Real y_dp_p1_bar "Pressure increase in ESP 1, bar";
	output Real y_dp_p2_bar "Pressure increase in ESP 2, bar";
	output Real y_dp1_f_p "Fraction of friction loss vs. ESP 1, -";
	output Real y_dp2_f_p "Fraction of friction loss vs. ESP 1, -";
	output Real y_dp_f_bp "Fraction of friction loss vs. BP, -";
	output Real y_Vd_w_m_d "Water flow to manifold, m3/d";
	output Real y_P_p1_kW "Power usage in ESP 1, kW";
	output Real y_P_p2_kW "Power usage in ESP 2, kW";
  // Equations
  equation
    // -- input values
	u_p_f = if time < 0.5 then 220e5 else 0.95*220e5;
	u_p_s = if time < 3 then 30e5 else 0.97*30e5;
	u_f_p = if time < 5 then 60 else 0.95*60;
	u_f_bp = 60;
	u_chi_w1 = 0.35;
	u_chi_w2 = 0.35;
	u_chi_w_m = 0.5;
	//
	// -- connecting subsystems
	//
	R2M1.p_f = u_p_f;
	R2M2.p_f = u_p_f;
	R2M1.p_m = M.p_m;
	R2M2.p_m = M.p_m;
	R2M1.f_p = u_f_p;
	R2M2.f_p = u_f_p;
	R2M1.chi_w = u_chi_w1;
	R2M2.chi_w = u_chi_w2;
	M.rho_v_1 = R2M1.rho_v;
	M.rho_v_2 = R2M2.rho_v;
	M.chi_w_1 = R2M1.chi_w;
	M.chi_w_2 = R2M2.chi_w;
	M.chi_w_m = u_chi_w_m;
	M.Vd_v_1 = R2M1.Vd_v;
	M.Vd_v_2 = R2M2.Vd_v;
	M.Vd_t = M2S.Vd;
	M.p_m = M2S.p_m;
	M2S.p_s = u_p_s;
	M2S.f_bp = u_f_bp;
	M2S.chi_w = M.chi_w_m;
	// -- outputs
	y_Vd_v1_d = R2M1.Vd_v*3600*24;
	y_Vd_v2_d = R2M2.Vd_v*3600*24;
	y_Vd_t_d = M2S.Vd*3600*24;
	y_Vd_w_m_d = M.Vd_w*3600*24;
	y_p_h1_bar = R2M1.p_h/1e5;
	y_p_h2_bar = R2M2.p_h/1e5;
	y_p_c_i1_bar = R2M1.p_c_i/1e5;
	y_p_c_i2_bar = R2M2.p_c_i/1e5;
	y_p_m_bar = M.p_m/1e5;
	y_dp_p1_bar = R2M1.dp_p/1e5;
	y_dp_p2_bar = R2M2.dp_p/1e5;
	y_dp_f1_bar = R2M1.dp_f/1e5;
	y_dp_f2_bar = R2M2.dp_f/1e5;
	y_dp_ft_bar = M2S.Dp_f/1e5;
	y_dp1_f_p = R2M1.dp_f/R2M1.dp_p*100;
	y_dp2_f_p = R2M2.dp_f/R2M2.dp_p*100;
	y_dp_f_bp = M2S.Dp_f/M2S.Dp_bp*100;
	y_P_p1_kW = R2M1.dp_p*R2M1.Vd_v/1e3;
	y_P_p2_kW = R2M2.dp_p*R2M2.Vd_v/1e3;
	
	//
  end Sim_Reservoir_2_Separator;
